"use client";

import type { ShelfSearchFilter } from "@/lib/types/shelf";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

type ShelfSearchPanelProps = {
  filter: ShelfSearchFilter;
  onChange: (filter: ShelfSearchFilter) => void;
  onClear: () => void;
};

/** 棚番マスタの検索・絞り込みパネル */
export function ShelfSearchPanel({
  filter,
  onChange,
  onClear,
}: ShelfSearchPanelProps) {
  const update = (key: keyof ShelfSearchFilter, value: string) => {
    onChange({ ...filter, [key]: value });
  };

  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <AccessInput
        id="shelf-search-number"
        label="棚番"
        value={filter.shelfNumber}
        onChange={(e) => update("shelfNumber", e.target.value)}
        placeholder="棚番で検索"
      />
      <AccessInput
        id="shelf-search-name"
        label="棚名"
        value={filter.shelfName}
        onChange={(e) => update("shelfName", e.target.value)}
        placeholder="棚名で検索"
      />
      <AccessInput
        id="shelf-search-location"
        label="保管場所"
        value={filter.location}
        onChange={(e) => update("location", e.target.value)}
        placeholder="保管場所で検索"
      />

      <div className="mb-3">
        <span className="access-label">条件の組み合わせ</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="shelf-filter-mode"
              checked={filter.mode === "AND"}
              onChange={() => onChange({ ...filter, mode: "AND" })}
            />
            AND
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="shelf-filter-mode"
              checked={filter.mode === "OR"}
              onChange={() => onChange({ ...filter, mode: "OR" })}
            />
            OR
          </label>
        </div>
      </div>

      <AccessButton variant="orange" onClick={onClear} className="w-full">
        条件クリア
      </AccessButton>
    </AccessPanel>
  );
}
