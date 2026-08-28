"use client";

import type {
  InventoryTransaction,
  InventoryTransactionFilter,
} from "@/lib/types/inventory-transaction";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

type HistorySearchPanelProps = {
  filter: InventoryTransactionFilter;
  onChange: (filter: InventoryTransactionFilter) => void;
  onClear: () => void;
};

/** 入出庫履歴の検索パネル */
export function HistorySearchPanel({
  filter,
  onChange,
  onClear,
}: HistorySearchPanelProps) {
  const update = <K extends keyof InventoryTransactionFilter>(
    key: K,
    value: InventoryTransactionFilter[K]
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
        id="history-shelf-code"
        label="棚番"
        value={filter.shelfCode}
        onChange={(e) => update("shelfCode", e.target.value)}
      />
      <div className="mb-2">
        <label htmlFor="history-type" className="access-label">
          区分
        </label>
        <select
          id="history-type"
          className="access-input w-full"
          value={filter.transactionType}
          onChange={(e) =>
            update(
              "transactionType",
              e.target.value as InventoryTransactionFilter["transactionType"]
            )
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
  transactions: InventoryTransaction[];
};

export function HistoryTable({ transactions }: HistoryTableProps) {
  if (transactions.length === 0) {
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
            <th>棚番</th>
            <th>入庫数</th>
            <th>出庫数</th>
            <th>処理前在庫</th>
            <th>処理後在庫</th>
            <th>担当者</th>
            <th>場所</th>
            <th>コメント</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((row) => (
            <tr key={row.id}>
              <td>{new Date(row.transaction_at).toLocaleString("ja-JP")}</td>
              <td>
                {row.transaction_type === "in"
                  ? "入庫"
                  : row.transaction_type === "out"
                    ? "出庫"
                    : "調整"}
              </td>
              <td>{row.part_number}</td>
              <td>{row.shelf_code}</td>
              <td className="text-right">{row.inbound_qty}</td>
              <td className="text-right">{row.outbound_qty}</td>
              <td className="text-right">{row.previous_stock}</td>
              <td className="text-right">{row.current_stock}</td>
              <td>{row.staff_code ?? ""}</td>
              <td>{row.location}</td>
              <td>{row.comment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
