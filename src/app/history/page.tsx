/**
 * 入出庫履歴画面
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  HistorySearchPanel,
  HistoryTable,
} from "@/components/history/HistoryPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchStockMovements } from "@/lib/supabase/stock-movements";
import { filterStockMovements } from "@/lib/utils/stock-movement";
import { downloadCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  emptyStockMovementFilter,
  type StockMovementFilter,
} from "@/lib/types/stock-movement";

export default function HistoryPage() {
  const [movements, setMovements] = useState<
    import("@/lib/types/stock-movement").StockMovement[]
  >([]);
  const [filter, setFilter] = useState<StockMovementFilter>(
    emptyStockMovementFilter
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMovements = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchStockMovements();
      setMovements(data);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const filtered = useMemo(
    () => filterStockMovements(movements, filter),
    [movements, filter]
  );

  const handleExport = () => {
    downloadCsv("stock_movements.csv", [
      [
        "performed_at",
        "movement_type",
        "part_number",
        "product_name",
        "shelf_number",
        "quantity",
        "quantity_before",
        "quantity_after",
        "memo",
      ],
      ...filtered.map((m) => [
        m.performed_at,
        m.movement_type,
        m.part_number,
        m.product_name,
        m.shelf_number,
        m.quantity,
        m.quantity_before,
        m.quantity_after,
        m.memo,
      ]),
    ]);
  };

  return (
    <AppLayout>
      <PageHeader title="入出庫履歴">
        <AccessButton variant="orange" onClick={handleExport} disabled={filtered.length === 0}>
          CSV出力
        </AccessButton>
        <AccessButton variant="orange" onClick={loadMovements} disabled={loading}>
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
          onChange={setFilter}
          onClear={() => setFilter(emptyStockMovementFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {filtered.length} / {movements.length} 件
          </div>
          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <HistoryTable movements={filtered} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
