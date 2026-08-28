/**
 * 入出庫履歴画面
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  HistorySearchPanel,
  HistoryTable,
} from "@/components/history/HistoryPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchAllInventoryTransactions,
  fetchInventoryTransactionsPage,
  inventoryTransactionsPageSize,
} from "@/lib/supabase/inventory-transactions";
import { downloadCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  emptyInventoryTransactionFilter,
  type InventoryTransaction,
  type InventoryTransactionFilter,
} from "@/lib/types/inventory-transaction";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [filter, setFilter] = useState<InventoryTransactionFilter>(
    emptyInventoryTransactionFilter
  );
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchInventoryTransactionsPage({
        filter,
        page,
        pageSize: inventoryTransactionsPageSize,
      });
      setTransactions(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFilterChange = (next: InventoryTransactionFilter) => {
    setFilter(next);
    setPage(0);
  };

  const handleClearFilter = () => {
    setFilter(emptyInventoryTransactionFilter);
    setPage(0);
  };

  const pageSize = inventoryTransactionsPageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayFrom = total === 0 ? 0 : page * pageSize + 1;
  const displayTo = Math.min((page + 1) * pageSize, total);

  const handleExport = async () => {
    try {
      const rows = await fetchAllInventoryTransactions(filter);
      downloadCsv("inventory_transactions.csv", [
        [
          "transaction_at",
          "transaction_type",
          "part_number",
          "shelf_code",
          "inbound_qty",
          "outbound_qty",
          "previous_stock",
          "current_stock",
          "staff_code",
          "location",
          "comment",
        ],
        ...rows.map((row) => [
          row.transaction_at,
          row.transaction_type,
          row.part_number,
          row.shelf_code,
          row.inbound_qty,
          row.outbound_qty,
          row.previous_stock,
          row.current_stock,
          row.staff_code ?? "",
          row.location,
          row.comment,
        ]),
      ]);
    } catch (err) {
      setError(formatSupabaseError(err));
    }
  };

  return (
    <AppLayout>
      <PageHeader title="入出庫履歴">
        <AccessButton
          variant="orange"
          onClick={handleExport}
          disabled={total === 0 || loading}
        >
          CSV出力
        </AccessButton>
        <AccessButton variant="orange" onClick={loadTransactions} disabled={loading}>
          更新
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <HistorySearchPanel
          filter={filter}
          onChange={handleFilterChange}
          onClear={handleClearFilter}
        />

        <div className="content-main">
          <div className="text-sm content-summary flex items-center gap-3">
            <span>
              表示: {displayFrom}-{displayTo} / {total} 件（{page + 1} / {totalPages}{" "}
              ページ）
            </span>
            <AccessButton
              variant="blue"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={loading || page === 0}
            >
              前へ
            </AccessButton>
            <AccessButton
              variant="blue"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || page + 1 >= totalPages}
            >
              次へ
            </AccessButton>
          </div>
          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <HistoryTable transactions={transactions} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
