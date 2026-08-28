/**
 * 製品マスタの一覧表
 * 行クリックで選択、ダブルクリックで編集
 */
"use client";

import type { Product } from "@/lib/types/product";
import { formatCurrency, formatNumber } from "@/lib/utils/product";

type MasterTableProps = {
  products: Product[];
  selectedId?: string | null;
  onSelect: (product: Product) => void;
  onEdit?: (product: Product) => void;
};

export function MasterTable({
  products,
  selectedId,
  onSelect,
  onEdit,
}: MasterTableProps) {
  if (products.length === 0) {
    return (
      <div className="access-panel p-4 text-center text-sm">
        製品マスタにデータがありません。新規登録から追加してください。
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
            <th>仕入先</th>
            <th>部門</th>
            <th>品番</th>
            <th>品名</th>
            <th>現在庫</th>
            <th>単価</th>
            <th>在庫金額</th>
            <th>発注点</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className={selectedId === product.id ? "selected" : ""}
              onClick={() => onSelect(product)}
              onDoubleClick={() => onEdit?.(product)}
              style={{ cursor: "pointer" }}
            >
              <td>{product.shelf_code}</td>
              <td>{product.supplier}</td>
              <td>{product.department}</td>
              <td>{product.part_number}</td>
              <td>{product.name}</td>
              <td className="text-right">{formatNumber(product.quantity)}</td>
              <td className="text-right">{formatCurrency(product.unit_price)}</td>
              <td className="text-right">{formatCurrency(product.stock_amount)}</td>
              <td className="text-right">{formatNumber(product.reorder_point)}</td>
              <td>{product.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
