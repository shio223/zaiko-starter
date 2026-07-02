"use client";

import type { Shelf } from "@/lib/types/shelf";

type ShelfTableProps = {
  shelves: Shelf[];
  selectedId?: string | null;
  onSelect: (shelf: Shelf) => void;
  onEdit?: (shelf: Shelf) => void;
};

/** 棚番マスタ一覧表 */
export function ShelfTable({
  shelves,
  selectedId,
  onSelect,
  onEdit,
}: ShelfTableProps) {
  if (shelves.length === 0) {
    return (
      <div className="access-panel p-4 text-center text-sm">
        棚番マスタにデータがありません。新規登録から追加してください。
      </div>
    );
  }

  return (
    <div className="table-scroll-wrapper access-panel flex-1">
      <p className="master-table-hint">行をクリックで選択 / ダブルクリックで編集</p>
      <table className="access-table">
        <thead>
          <tr>
            <th>棚番</th>
            <th>棚名</th>
            <th>保管場所</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {shelves.map((shelf) => (
            <tr
              key={shelf.id}
              className={selectedId === shelf.id ? "selected" : ""}
              onClick={() => onSelect(shelf)}
              onDoubleClick={() => onEdit?.(shelf)}
              style={{ cursor: "pointer" }}
            >
              <td>{shelf.shelf_number}</td>
              <td>{shelf.shelf_name}</td>
              <td>{shelf.location}</td>
              <td>{shelf.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
