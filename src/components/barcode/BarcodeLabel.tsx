"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type BarcodeLabelProps = {
  partNumber: string;
  productName: string;
  shelfNumber: string;
};

/** バーコードラベル（印刷用） */
export function BarcodeLabel({
  partNumber,
  productName,
  shelfNumber,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !partNumber) return;
    try {
      JsBarcode(svgRef.current, partNumber, {
        format: "CODE128",
        width: 1.5,
        height: 48,
        displayValue: true,
        fontSize: 14,
        margin: 4,
      });
    } catch {
      // 無効な品番の場合はバーコードを描画しない
    }
  }, [partNumber]);

  return (
    <div className="barcode-label">
      <svg ref={svgRef} />
      <div className="barcode-label-text">{productName}</div>
      {shelfNumber && (
        <div className="barcode-label-sub">棚番: {shelfNumber}</div>
      )}
    </div>
  );
}
