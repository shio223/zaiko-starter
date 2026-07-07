"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { BARCODE_LABEL_CONFIG } from "@/lib/barcode/config";

type BarcodeLabelProps = {
  partNumber: string;
  productName: string;
  shelfNumber: string;
  preview?: boolean;
};

/** Brother QL-700 62mm幅ラベル（印刷・プレビュー共用） */
export function BarcodeLabel({
  partNumber,
  productName,
  shelfNumber,
  preview = false,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { format, width, height, displayValue, fontSize, margin } =
    BARCODE_LABEL_CONFIG;

  useEffect(() => {
    if (!svgRef.current || !partNumber) return;
    try {
      JsBarcode(svgRef.current, partNumber, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin,
      });
    } catch {
      // 無効な品番の場合はバーコードを描画しない
    }
  }, [partNumber, format, width, height, displayValue, fontSize, margin]);

  return (
    <div
      className={`barcode-label ${preview ? "barcode-label-preview" : ""}`}
      style={{ width: `${BARCODE_LABEL_CONFIG.labelWidthMm}mm` }}
    >
      <div className="barcode-label-header">
        <span>棚番: {shelfNumber || "-"}</span>
        <span>品番: {partNumber}</span>
      </div>
      <div className="barcode-label-name">{productName}</div>
      <div className="barcode-label-code">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
