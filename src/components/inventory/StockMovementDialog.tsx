"use client";

import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessTextarea } from "@/components/ui/AccessTextarea";
import { AccessButton } from "@/components/ui/AccessButton";
import { formatCurrency, formatNumber } from "@/lib/utils/product";

type StockMovementDialogProps = {
  product: Product;
  type: "in" | "out";
  onConfirm: (quantity: number, memo: string) => Promise<void>;
  onCancel: () => void;
};

/** 入庫・出庫ダイアログ */
export function StockMovementDialog({
  product,
  type,
  onConfirm,
  onCancel,
}: StockMovementDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = type === "in" ? "入庫" : "出庫";

  const handleSubmit = async () => {
    if (quantity <= 0) {
      setError("数量は1以上で入力してください。");
      return;
    }
    if (type === "out" && quantity > product.quantity) {
      setError("出庫数が在庫数を超えています。");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onConfirm(quantity, memo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。");
      setSaving(false);
    }
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <AccessPanel title={`${label}処理`} className="dialog-panel">
        <p className="mb-2 text-sm">
          <strong>{product.part_number}</strong> — {product.product_name}
        </p>
        <p className="mb-3 text-sm">
          現在庫: {formatNumber(product.quantity)} / 発注点:{" "}
          {formatNumber(product.reorder_point)} / 単価:{" "}
          {formatCurrency(product.unit_price)}
        </p>

        <AccessInput
          id="movement-quantity"
          label={`${label}数量`}
          type="number"
          min={1}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          disabled={saving}
          required
        />
        <AccessTextarea
          id="movement-memo"
          label="備考"
          rows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={saving}
        />

        {error && <p className="field-error mb-2">{error}</p>}

        <div className="dialog-actions">
          <AccessButton variant="green" onClick={handleSubmit} disabled={saving}>
            {saving ? "処理中..." : label}
          </AccessButton>
          <AccessButton variant="orange" onClick={onCancel} disabled={saving}>
            キャンセル
          </AccessButton>
        </div>
      </AccessPanel>
    </div>
  );
}
