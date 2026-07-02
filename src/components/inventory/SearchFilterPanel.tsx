/**
 * 検索・絞り込みパネル（在庫リスト・マスタ一覧の左側）
 * 品番・品名・棚番・仕入先 + AND/OR 切り替え
 */
"use client";

import type { SearchFilter } from "@/lib/types/product";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";

type SearchFilterPanelProps = {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
  onClear: () => void;
};

export function SearchFilterPanel({
  filter,
  onChange,
  onClear,
}: SearchFilterPanelProps) {
  const update = (key: keyof SearchFilter, value: string) => {
    onChange({ ...filter, [key]: value });
  };

  return (
    <AccessPanel title="検索・絞り込み" className="search-filter-panel">
      <AccessInput
        id="search-part-number"
        label="品番"
        value={filter.partNumber}
        onChange={(e) => update("partNumber", e.target.value)}
        placeholder="品番で検索"
      />
      <AccessInput
        id="search-product-name"
        label="品名"
        value={filter.productName}
        onChange={(e) => update("productName", e.target.value)}
        placeholder="品名で検索"
      />
      <AccessInput
        id="search-shelf-number"
        label="棚番"
        value={filter.shelfNumber}
        onChange={(e) => update("shelfNumber", e.target.value)}
        placeholder="棚番で検索"
      />
      <AccessInput
        id="search-supplier"
        label="仕入先"
        value={filter.supplier}
        onChange={(e) => update("supplier", e.target.value)}
        placeholder="仕入先で検索"
      />

      <div className="mb-3">
        <span className="access-label">条件の組み合わせ</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="filter-mode"
              checked={filter.mode === "AND"}
              onChange={() => onChange({ ...filter, mode: "AND" })}
            />
            AND
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="radio"
              name="filter-mode"
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
