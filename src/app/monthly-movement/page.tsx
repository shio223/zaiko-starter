/**
 * 月別移動量画面
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  MonthlyMovementSearchPanel,
  MonthlyMovementTable,
} from "@/components/monthly-movement/MonthlyMovementPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchMonthlyMovementMonths,
  fetchMonthlyMovements,
} from "@/lib/supabase/monthly-movements";
import { downloadCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  emptyMonthlyMovementFilter,
  type MonthlyMovementFilter,
  type MonthlyMovementRow,
} from "@/lib/types/monthly-movement";

export default function MonthlyMovementPage() {
  const [filter, setFilter] = useState<MonthlyMovementFilter>(
    emptyMonthlyMovementFilter
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MonthlyMovementRow[]>([]);
  const [yearMonths, setYearMonths] = useState<string[]>([]);
  const [totalUnfiltered, setTotalUnfiltered] = useState(0);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const hasFilter = Boolean(
        filter.yearMonth.trim() ||
          filter.partNumber.trim() ||
          filter.productName.trim()
      );

      const [months, filteredRows, allRows] = await Promise.all([
        fetchMonthlyMovementMonths(),
        fetchMonthlyMovements(filter),
        hasFilter
          ? fetchMonthlyMovements(emptyMonthlyMovementFilter)
          : Promise.resolve(null),
      ]);

      setYearMonths(months);
      setRows(filteredRows);
      setTotalUnfiltered(allRows?.length ?? filteredRows.length);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = () => {
    downloadCsv("monthly_movement.csv", [
      [
        "year_month",
        "part_number",
        "product_name",
        "shelf_number",
        "in_quantity",
        "out_quantity",
        "net_quantity",
      ],
      ...rows.map((r) => [
        r.yearMonth,
        r.part_number,
        r.product_name,
        r.shelf_number,
        r.in_quantity,
        r.out_quantity,
        r.net_quantity,
      ]),
    ]);
  };

  return (
    <AppLayout>
      <PageHeader title="月別移動量">
        <AccessButton
          variant="orange"
          onClick={handleExport}
          disabled={rows.length === 0}
        >
          CSV出力
        </AccessButton>
        <AccessButton variant="orange" onClick={loadData} disabled={loading}>
          更新
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <MonthlyMovementSearchPanel
          filter={filter}
          yearMonths={yearMonths}
          onChange={setFilter}
          onClear={() => setFilter(emptyMonthlyMovementFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {rows.length} / {totalUnfiltered} 件
          </div>
          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <MonthlyMovementTable rows={rows} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
