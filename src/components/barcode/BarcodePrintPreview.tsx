"use client";

import type { Product } from "@/lib/types/product";
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { BARCODE_LABEL_CONFIG } from "@/lib/barcode/config";

type BarcodePrintPreviewProps = {
  items: { product: Product; copies: number }[];
};

/** 62mm幅ラベルの印刷プレビュー */
export function BarcodePrintPreview({ items }: BarcodePrintPreviewProps) {
  if (items.length === 0) {
    return (
      <AccessPanel title="ラベルプレビュー" className="barcode-preview-panel">
        <p className="text-sm">製品を選択するとプレビューが表示されます。</p>
      </AccessPanel>
    );
  }

  const totalLabels = items.reduce((sum, item) => sum + item.copies, 0);

  return (
    <AccessPanel title="ラベルプレビュー" className="barcode-preview-panel">
      <p className="text-sm mb-2">
        Brother QL-700（{BARCODE_LABEL_CONFIG.labelWidthMm}mm幅）/
        バーコード: {BARCODE_LABEL_CONFIG.format} / 合計 {totalLabels} 枚
      </p>
      <div className="barcode-preview-scroll">
        {items.flatMap(({ product, copies }) =>
          Array.from({ length: copies }, (_, index) => (
            <BarcodeLabel
              key={`${product.id}-${index}`}
              partNumber={product.part_number}
              productName={product.product_name}
              shelfNumber={product.shelf_number}
              preview
            />
          ))
        )}
      </div>
    </AccessPanel>
  );
}
