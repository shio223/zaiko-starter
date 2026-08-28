"use client";

import type { Product } from "@/lib/types/product";
import { isBelowReorderPoint } from "@/lib/types/product";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { formatCurrency, formatNumber } from "@/lib/utils/product";

type SelectedProductPanelProps = {
  product: Product | null;
};

/** 選択中の製品情報 */
export function SelectedProductPanel({ product }: SelectedProductPanelProps) {
  if (!product) {
    return (
      <AccessPanel title="選択中の製品" className="search-filter-panel">
        <p className="text-sm">一覧から製品を選択してください。</p>
      </AccessPanel>
    );
  }

  const isLowStock = isBelowReorderPoint(product);

  return (
    <AccessPanel title="選択中の製品" className="search-filter-panel">
      <dl className="selected-product-dl">
        <dt>品番</dt>
        <dd>{product.part_number}</dd>
        <dt>品名</dt>
        <dd>{product.name}</dd>
        <dt>棚番</dt>
        <dd>{product.shelf_code}</dd>
        <dt>現在庫</dt>
        <dd className={isLowStock ? "text-red-700 font-bold" : ""}>
          {formatNumber(product.quantity)}
          {isLowStock && "（発注点以下）"}
        </dd>
        <dt>単価</dt>
        <dd>{formatCurrency(product.unit_price)}</dd>
        <dt>在庫金額</dt>
        <dd>{formatCurrency(product.stock_amount)}</dd>
      </dl>
    </AccessPanel>
  );
}
