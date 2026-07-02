"use client";

import type { MonthlyMovementFilter } from "@/lib/types/monthly-movement";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";
import { formatNumber } from "@/lib/utils/product";
import type { MonthlyMovementRow } from "@/lib/types/monthly-movement";

type MonthlyMovementSearchPanelProps = {
  filter: MonthlyMovementFilter;
  yearMonths: string[];
  onChange: (filter: MonthlyMovementFilter) => void;
  onClear: () => void;
};

export function MonthlyMovementSearchPanel({
  filter,
  yearMonths,
  onChange,
  onClear,
}: MonthlyMovementSearchPanelProps) {
  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <div className="mb-2">
        <label htmlFor="monthly-year-month" className="access-label">
          年月
        </label>
        <select
          id="monthly-year-month"
          className="access-input w-full"
          value={filter.yearMonth}
          onChange={(e) => onChange({ ...filter, yearMonth: e.target.value })}
        >
          <option value="">すべて</option>
          {yearMonths.map((ym) => (
            <option key={ym} value={ym}>
              {ym}
            </option>
          ))}
        </select>
      </div>
      <AccessInput
        id="monthly-part-number"
        label="品番"
        value={filter.partNumber}
        onChange={(e) => onChange({ ...filter, partNumber: e.target.value })}
      />
      <AccessInput
        id="monthly-product-name"
        label="品名"
        value={filter.productName}
        onChange={(e) => onChange({ ...filter, productName: e.target.value })}
      />
      <AccessButton variant="orange" onClick={onClear} className="w-full">
        条件クリア
      </AccessButton>
    </AccessPanel>
  );
}

type MonthlyMovementTableProps = {
  rows: MonthlyMovementRow[];
};

export function MonthlyMovementTable({ rows }: MonthlyMovementTableProps) {
  if (rows.length === 0) {
    return (
      <div className="access-panel p-4 text-center text-sm">
        該当するデータがありません
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper access-panel flex-1">
      <table className="access-table">
        <thead>
          <tr>
            <th>年月</th>
            <th>品番</th>
            <th>品名</th>
            <th>棚番</th>
            <th>入庫数</th>
            <th>出庫数</th>
            <th>差引</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.yearMonth}-${row.part_number}`}>
              <td>{row.yearMonth}</td>
              <td>{row.part_number}</td>
              <td>{row.product_name}</td>
              <td>{row.shelf_number}</td>
              <td className="text-right">{formatNumber(row.in_quantity)}</td>
              <td className="text-right">{formatNumber(row.out_quantity)}</td>
              <td className="text-right">{formatNumber(row.net_quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
