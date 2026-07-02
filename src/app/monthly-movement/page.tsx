/**
 * 月別移動量画面
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  MonthlyMovementSearchPanel,
  MonthlyMovementTable,
} from "@/components/monthly-movement/MonthlyMovementPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchStockMovements } from "@/lib/supabase/stock-movements";
import {
  aggregateMonthlyMovements,
  filterMonthlyMovements,
  getAvailableYearMonths,
} from "@/lib/utils/stock-movement";
import { downloadCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import { emptyMonthlyMovementFilter } from "@/lib/types/monthly-movement";

export default function MonthlyMovementPage() {
  const [filter, setFilter] = useState(emptyMonthlyMovementFilter);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allRows, setAllRows] = useState<
    import("@/lib/types/monthly-movement").MonthlyMovementRow[]
  >([]);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const movements = await fetchStockMovements();
      setAllRows(aggregateMonthlyMovements(movements));
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(
    () => filterMonthlyMovements(allRows, filter),
    [allRows, filter]
  );

  const yearMonths = useMemo(() => getAvailableYearMonths(allRows), [allRows]);

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
      ...filtered.map((r) => [
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
        <AccessButton variant="orange" onClick={handleExport} disabled={filtered.length === 0}>
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
            表示件数: {filtered.length} / {allRows.length} 件
          </div>
          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <MonthlyMovementTable rows={filtered} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
