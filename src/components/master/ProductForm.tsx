/**
 * 製品マスタの入力フォーム
 * 新規登録・編集の両方で使用（Access版の製品マスタ画面に相当）
 */
"use client";

import type { ProductFormData } from "@/lib/types/product";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessTextarea } from "@/components/ui/AccessTextarea";
import { AccessPanel } from "@/components/ui/AccessPanel";

type ProductFormProps = {
  data: ProductFormData;
  onChange: (data: ProductFormData) => void;
  disabled?: boolean;
};

export function ProductForm({ data, onChange, disabled = false }: ProductFormProps) {
  const update = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  const parseNumber = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <AccessPanel title="製品情報入力" className="max-w-2xl">
      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <AccessInput
          id="shelf_number"
          label="棚番"
          value={data.shelf_number}
          onChange={(e) => update("shelf_number", e.target.value)}
          disabled={disabled}
        />
        <AccessInput
          id="supplier"
          label="仕入先"
          value={data.supplier}
          onChange={(e) => update("supplier", e.target.value)}
          disabled={disabled}
        />
        <AccessInput
          id="department"
          label="部門"
          value={data.department}
          onChange={(e) => update("department", e.target.value)}
          disabled={disabled}
        />
        <AccessInput
          id="part_number"
          label="品番"
          value={data.part_number}
          onChange={(e) => update("part_number", e.target.value)}
          disabled={disabled}
        />
        <AccessInput
          id="product_name"
          label="品名"
          value={data.product_name}
          onChange={(e) => update("product_name", e.target.value)}
          disabled={disabled}
          className="sm:col-span-2"
        />
        <AccessInput
          id="quantity"
          label="数量（在庫数）"
          type="number"
          value={data.quantity}
          onChange={(e) => update("quantity", parseNumber(e.target.value))}
          disabled={disabled}
        />
        <AccessInput
          id="unit_price"
          label="単価"
          type="number"
          value={data.unit_price}
          onChange={(e) => update("unit_price", parseNumber(e.target.value))}
          disabled={disabled}
        />
        <AccessInput
          id="reorder_point"
          label="発注点"
          type="number"
          value={data.reorder_point}
          onChange={(e) => update("reorder_point", parseNumber(e.target.value))}
          disabled={disabled}
        />
        <AccessInput
          id="last_inventory_count"
          label="最終棚卸数"
          type="number"
          value={data.last_inventory_count}
          onChange={(e) =>
            update("last_inventory_count", parseNumber(e.target.value))
          }
          disabled={disabled}
        />
        <div className="sm:col-span-2">
          <AccessTextarea
            id="memo"
            label="備考"
            rows={3}
            value={data.memo}
            onChange={(e) => update("memo", e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="mt-2 border-t border-[#808080] pt-2 text-sm">
        在庫金額（自動計算）: ¥
        {new Intl.NumberFormat("ja-JP").format(data.quantity * data.unit_price)}
      </div>
    </AccessPanel>
  );
}
