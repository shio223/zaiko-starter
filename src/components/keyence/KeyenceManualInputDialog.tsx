"use client";

import { useState } from "react";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessButton } from "@/components/ui/AccessButton";
import type { KeyenceImportRow } from "@/lib/types/keyence-import";

type KeyenceManualInputDialogProps = {
  onAdd: (
    row: Pick<
      KeyenceImportRow,
      | "part_number"
      | "product_name"
      | "shelf_code"
      | "movement_type"
      | "quantity"
      | "memo"
    >
  ) => void;
  onCancel: () => void;
};

/** KEYENCE 手動入力行の追加 */
export function KeyenceManualInputDialog({
  onAdd,
  onCancel,
}: KeyenceManualInputDialogProps) {
  const [partNumber, setPartNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [shelfCode, setShelfCode] = useState("");
  const [movementType, setMovementType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(1);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!partNumber.trim()) {
      setError("品番を入力してください。");
      return;
    }
    if (quantity <= 0) {
      setError("数量は1以上で入力してください。");
      return;
    }

    onAdd({
      part_number: partNumber.trim(),
      product_name: productName.trim(),
      shelf_code: shelfCode.trim(),
      movement_type: movementType,
      quantity,
      memo: memo.trim(),
    });
  };

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <AccessPanel title="手動入力" className="dialog-panel">
        <AccessInput
          id="manual-part-number"
          label="品番"
          value={partNumber}
          onChange={(e) => setPartNumber(e.target.value)}
          required
        />
        <AccessInput
          id="manual-product-name"
          label="品名"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <AccessInput
          id="manual-shelf-number"
          label="棚番"
          value={shelfCode}
          onChange={(e) => setShelfCode(e.target.value)}
        />
        <div className="mb-2">
          <label htmlFor="manual-movement-type" className="access-label">
            区分
          </label>
          <select
            id="manual-movement-type"
            className="access-input w-full"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as "in" | "out")}
          >
            <option value="in">入庫</option>
            <option value="out">出庫</option>
          </select>
        </div>
        <AccessInput
          id="manual-quantity"
          label="数量"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
        <AccessInput
          id="manual-memo"
          label="備考"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />

        {error && <p className="field-error mb-2">{error}</p>}

        <div className="dialog-actions">
          <AccessButton variant="green" onClick={handleAdd}>
            追加
          </AccessButton>
          <AccessButton variant="orange" onClick={onCancel}>
            キャンセル
          </AccessButton>
        </div>
      </AccessPanel>
    </div>
  );
}
