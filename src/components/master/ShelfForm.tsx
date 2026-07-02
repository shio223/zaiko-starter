"use client";

import type { ShelfFormData } from "@/lib/types/shelf";
import type { ShelfFormErrors } from "@/lib/utils/shelf-validation";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessTextarea } from "@/components/ui/AccessTextarea";
import { AccessPanel } from "@/components/ui/AccessPanel";

type ShelfFormProps = {
  data: ShelfFormData;
  onChange: (data: ShelfFormData) => void;
  errors?: ShelfFormErrors;
  disabled?: boolean;
};

/** 棚番マスタの入力フォーム */
export function ShelfForm({
  data,
  onChange,
  errors = {},
  disabled = false,
}: ShelfFormProps) {
  const update = <K extends keyof ShelfFormData>(
    key: K,
    value: ShelfFormData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <AccessPanel title="棚番情報入力" className="product-form-panel">
      <div className="product-form-grid">
        <AccessInput
          id="shelf_number"
          label="棚番"
          value={data.shelf_number}
          onChange={(e) => update("shelf_number", e.target.value)}
          disabled={disabled}
          error={errors.shelf_number}
          required
        />
        <AccessInput
          id="shelf_name"
          label="棚名"
          value={data.shelf_name}
          onChange={(e) => update("shelf_name", e.target.value)}
          disabled={disabled}
          error={errors.shelf_name}
          required
        />
        <AccessInput
          id="location"
          label="保管場所"
          value={data.location}
          onChange={(e) => update("location", e.target.value)}
          disabled={disabled}
          error={errors.location}
          className="product-form-full"
        />
        <div className="product-form-full">
          <AccessTextarea
            id="shelf_memo"
            label="備考"
            rows={3}
            value={data.memo}
            onChange={(e) => update("memo", e.target.value)}
            disabled={disabled}
            error={errors.memo}
          />
        </div>
      </div>
    </AccessPanel>
  );
}
