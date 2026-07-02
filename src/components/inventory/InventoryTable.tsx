/**
 * 在庫リストの一覧表
 * 黄色ヘッダー・横スクロール対応（iPad向け）
 */
"use client";

import type { Product } from "@/lib/types/product";
import { formatCurrency, formatNumber } from "@/lib/utils/product";

type InventoryTableProps = {
  products: Product[];
  selectedId?: string | null;
  onSelect?: (product: Product) => void;
};

export function InventoryTable({
  products,
  selectedId,
  onSelect,
}: InventoryTableProps) {
  if (products.length === 0) {
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
            <th>棚番</th>
            <th>仕入先</th>
            <th>部門</th>
            <th>品番</th>
            <th>品名</th>
            <th>在庫数</th>
            <th>単価</th>
            <th>在庫金額</th>
            <th>発注点</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isLowStock =
              product.reorder_point > 0 &&
              product.quantity <= product.reorder_point;

            return (
            <tr
              key={product.id}
              className={`${selectedId === product.id ? "selected" : ""} ${isLowStock ? "row-low-stock" : ""}`}
              onClick={() => onSelect?.(product)}
              style={{ cursor: onSelect ? "pointer" : "default" }}
            >
              <td>{product.shelf_number}</td>
              <td>{product.supplier}</td>
              <td>{product.department}</td>
              <td>{product.part_number}</td>
              <td>{product.product_name}</td>
              <td className="text-right">{formatNumber(product.quantity)}</td>
              <td className="text-right">{formatCurrency(product.unit_price)}</td>
              <td className="text-right">{formatCurrency(product.stock_amount)}</td>
              <td className="text-right">{formatNumber(product.reorder_point)}</td>
              <td>{product.memo}</td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
