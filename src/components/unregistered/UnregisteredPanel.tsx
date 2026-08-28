"use client";

import type {
  UnregisteredEntry,
  UnregisteredEntryFilter,
} from "@/lib/types/unregistered-entry";
import {
  getUnregisteredModeLabel,
  getUnregisteredStatusLabel,
} from "@/lib/types/unregistered-entry";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

type UnregisteredSearchPanelProps = {
  filter: UnregisteredEntryFilter;
  onChange: (filter: UnregisteredEntryFilter) => void;
  onClear: () => void;
};

/** 未登録リストの検索パネル */
export function UnregisteredSearchPanel({
  filter,
  onChange,
  onClear,
}: UnregisteredSearchPanelProps) {
  const update = <K extends keyof UnregisteredEntryFilter>(
    key: K,
    value: UnregisteredEntryFilter[K]
  ) => {
    onChange({ ...filter, [key]: value });
  };

  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <AccessInput
        id="unreg-part-number"
        label="品番"
        value={filter.partNumber}
        onChange={(e) => update("partNumber", e.target.value)}
      />
      <AccessInput
        id="unreg-shelf-code"
        label="棚番"
        value={filter.shelfCode}
        onChange={(e) => update("shelfCode", e.target.value)}
      />
      <div className="mb-2">
        <label htmlFor="unreg-mode" className="access-label">
          mode
        </label>
        <select
          id="unreg-mode"
          className="access-input w-full"
          value={filter.mode}
          onChange={(e) =>
            update("mode", e.target.value as UnregisteredEntryFilter["mode"])
          }
        >
          <option value="">すべて</option>
          <option value="1">1 = 入庫</option>
          <option value="2">2 = 出庫</option>
          <option value="3">3 = 棚卸</option>
        </select>
      </div>
      <AccessInput
        id="unreg-date-from"
        label="日付（から）"
        type="date"
        value={filter.dateFrom}
        onChange={(e) => update("dateFrom", e.target.value)}
      />
      <AccessInput
        id="unreg-date-to"
        label="日付（まで）"
        type="date"
        value={filter.dateTo}
        onChange={(e) => update("dateTo", e.target.value)}
      />
      <div className="mb-2">
        <label htmlFor="unreg-status" className="access-label">
          status
        </label>
        <select
          id="unreg-status"
          className="access-input w-full"
          value={filter.status}
          onChange={(e) =>
            update(
              "status",
              e.target.value as UnregisteredEntryFilter["status"]
            )
          }
        >
          <option value="">すべて</option>
          <option value="open">未解消</option>
          <option value="resolved">解消済み</option>
        </select>
      </div>
      <AccessButton variant="orange" onClick={onClear} className="w-full">
        条件クリア
      </AccessButton>
    </AccessPanel>
  );
}

type UnregisteredTableProps = {
  entries: UnregisteredEntry[];
};

function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleString("ja-JP");
}

/** 未登録リストの一覧表 */
export function UnregisteredTable({ entries }: UnregisteredTableProps) {
  if (entries.length === 0) {
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
            <th>取込日時</th>
            <th>スキャン日時</th>
            <th>mode</th>
            <th>mode名称</th>
            <th>品番</th>
            <th>棚番</th>
            <th>数量</th>
            <th>担当者コード</th>
            <th>端末ID</th>
            <th>status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => (
            <tr key={row.id}>
              <td>{formatDateTime(row.created_at)}</td>
              <td>{formatDateTime(row.scanned_at)}</td>
              <td className="text-right">{row.mode}</td>
              <td>{getUnregisteredModeLabel(row.mode)}</td>
              <td>{row.part_number}</td>
              <td>{row.shelf_code}</td>
              <td className="text-right">
                {row.quantity === null || row.quantity === undefined
                  ? ""
                  : row.quantity}
              </td>
              <td>{row.staff_code ?? ""}</td>
              <td>{row.device_id}</td>
              <td>{getUnregisteredStatusLabel(row.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
