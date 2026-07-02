"use client";

import type { StockMovement, StockMovementFilter } from "@/lib/types/stock-movement";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

type HistorySearchPanelProps = {
  filter: StockMovementFilter;
  onChange: (filter: StockMovementFilter) => void;
  onClear: () => void;
};

/** 入出庫履歴の検索パネル */
export function HistorySearchPanel({
  filter,
  onChange,
  onClear,
}: HistorySearchPanelProps) {
  const update = <K extends keyof StockMovementFilter>(
    key: K,
    value: StockMovementFilter[K]
  ) => {
    onChange({ ...filter, [key]: value });
  };

  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <AccessInput
        id="history-part-number"
        label="品番"
        value={filter.partNumber}
        onChange={(e) => update("partNumber", e.target.value)}
      />
      <AccessInput
        id="history-product-name"
        label="品名"
        value={filter.productName}
        onChange={(e) => update("productName", e.target.value)}
      />
      <div className="mb-2">
        <label htmlFor="history-type" className="access-label">
          区分
        </label>
        <select
          id="history-type"
          className="access-input w-full"
          value={filter.movementType}
          onChange={(e) =>
            update("movementType", e.target.value as StockMovementFilter["movementType"])
          }
        >
          <option value="">すべて</option>
          <option value="in">入庫</option>
          <option value="out">出庫</option>
          <option value="adjust">調整</option>
        </select>
      </div>
      <AccessInput
        id="history-date-from"
        label="日付（から）"
        type="date"
        value={filter.dateFrom}
        onChange={(e) => update("dateFrom", e.target.value)}
      />
      <AccessInput
        id="history-date-to"
        label="日付（まで）"
        type="date"
        value={filter.dateTo}
        onChange={(e) => update("dateTo", e.target.value)}
      />
      <AccessButton variant="orange" onClick={onClear} className="w-full">
        条件クリア
      </AccessButton>
    </AccessPanel>
  );
}

type HistoryTableProps = {
  movements: StockMovement[];
};

export function HistoryTable({ movements }: HistoryTableProps) {
  if (movements.length === 0) {
    return (
      <div className="access-panel p-4 text-center text-sm">
        該当する履歴がありません
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper access-panel flex-1">
      <table className="access-table">
        <thead>
          <tr>
            <th>日時</th>
            <th>区分</th>
            <th>品番</th>
            <th>品名</th>
            <th>棚番</th>
            <th>数量</th>
            <th>変更前</th>
            <th>変更後</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id}>
              <td>{new Date(m.performed_at).toLocaleString("ja-JP")}</td>
              <td>
                {m.movement_type === "in"
                  ? "入庫"
                  : m.movement_type === "out"
                    ? "出庫"
                    : "調整"}
              </td>
              <td>{m.part_number}</td>
              <td>{m.product_name}</td>
              <td>{m.shelf_number}</td>
              <td className="text-right">{m.quantity}</td>
              <td className="text-right">{m.quantity_before}</td>
              <td className="text-right">{m.quantity_after}</td>
              <td>{m.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
