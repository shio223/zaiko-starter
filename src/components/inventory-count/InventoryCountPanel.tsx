"use client";

import type { InventoryCount, InventoryCountFilter } from "@/lib/types/inventory-count";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";
import { getInventoryCountStatusLabel } from "@/lib/supabase/inventory-counts";

type InventoryCountSearchPanelProps = {
  filter: InventoryCountFilter;
  onChange: (filter: InventoryCountFilter) => void;
  onClear: () => void;
};

export function InventoryCountSearchPanel({
  filter,
  onChange,
  onClear,
}: InventoryCountSearchPanelProps) {
  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <AccessInput
        id="count-title"
        label="タイトル"
        value={filter.title}
        onChange={(e) => onChange({ ...filter, title: e.target.value })}
      />
      <div className="mb-2">
        <label htmlFor="count-status" className="access-label">
          状態
        </label>
        <select
          id="count-status"
          className="access-input w-full"
          value={filter.status}
          onChange={(e) =>
            onChange({
              ...filter,
              status: e.target.value as InventoryCountFilter["status"],
            })
          }
        >
          <option value="">すべて</option>
          <option value="in_progress">実施中</option>
          <option value="completed">確定</option>
        </select>
      </div>
      <AccessInput
        id="count-date-from"
        label="日付（から）"
        type="date"
        value={filter.dateFrom}
        onChange={(e) => onChange({ ...filter, dateFrom: e.target.value })}
      />
      <AccessInput
        id="count-date-to"
        label="日付（まで）"
        type="date"
        value={filter.dateTo}
        onChange={(e) => onChange({ ...filter, dateTo: e.target.value })}
      />
      <AccessButton variant="orange" onClick={onClear} className="w-full">
        条件クリア
      </AccessButton>
    </AccessPanel>
  );
}

type InventoryCountTableProps = {
  counts: InventoryCount[];
  selectedId?: string | null;
  onSelect: (count: InventoryCount) => void;
  onOpen: (count: InventoryCount) => void;
};

export function InventoryCountTable({
  counts,
  selectedId,
  onSelect,
  onOpen,
}: InventoryCountTableProps) {
  if (counts.length === 0) {
    return (
      <div className="access-panel p-4 text-center text-sm">
        棚卸データがありません。「棚卸開始」から作成してください。
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper access-panel flex-1">
      <p className="master-table-hint">行をクリックで選択 / ダブルクリックで明細表示</p>
      <table className="access-table">
        <thead>
          <tr>
            <th>日付</th>
            <th>タイトル</th>
            <th>状態</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {counts.map((count) => (
            <tr
              key={count.id}
              className={selectedId === count.id ? "selected" : ""}
              onClick={() => onSelect(count)}
              onDoubleClick={() => onOpen(count)}
              style={{ cursor: "pointer" }}
            >
              <td>{count.count_date}</td>
              <td>{count.title}</td>
              <td>{getInventoryCountStatusLabel(count.status)}</td>
              <td>{count.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
