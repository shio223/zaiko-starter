"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { BARCODE_LABEL_CONFIG } from "@/lib/barcode/config";
import { encodeFullAsciiCode39 } from "@/lib/barcode/code39";

type BarcodeLabelProps = {
  partNumber: string;
  productName: string;
  shelfNumber: string;
  preview?: boolean;
};

/**
 * Brother QL-700 62mmロール向けラベル
 * 上から: 棚番 → 品名 → Code-39バーコード → 品番文字列（元のまま）
 */
export function BarcodeLabel({
  partNumber,
  productName,
  shelfNumber,
  preview = false,
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const { format, width, height, displayValue, fontSize, margin } =
    BARCODE_LABEL_CONFIG;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }

    svg.innerHTML = "";

    if (!partNumber) {
      setBarcodeError("この品番にはCode-39で印刷できない文字が含まれています");
      return;
    }

    if (format !== "CODE39") {
      setBarcodeError("バーコード規格がCode-39ではありません");
      return;
    }

    const encoded = encodeFullAsciiCode39(partNumber);
    if (!encoded.ok) {
      setBarcodeError(encoded.message);
      return;
    }

    try {
      // バー用は Full ASCII 変換後。表示用 text は渡さない（displayValue: false）
      JsBarcode(svg, encoded.encoded, {
        format: "CODE39",
        width,
        height,
        displayValue,
        fontSize,
        margin,
      });
      setBarcodeError(null);
    } catch {
      setBarcodeError("この品番にはCode-39で印刷できない文字が含まれています");
    }
  }, [partNumber, format, width, height, displayValue, fontSize, margin]);

  return (
    <div
      className={`barcode-label ${preview ? "barcode-label-preview" : ""}`}
      style={{ width: `${BARCODE_LABEL_CONFIG.labelWidthMm}mm` }}
    >
      <div className="barcode-label-shelf">{shelfNumber || "-"}</div>
      <div className="barcode-label-name">{productName || "-"}</div>
      <div className="barcode-label-code">
        {barcodeError ? (
          <div className="barcode-label-error">{barcodeError}</div>
        ) : null}
        <svg
          ref={svgRef}
          className={barcodeError ? "barcode-label-svg-hidden" : undefined}
          aria-hidden={barcodeError ? true : undefined}
        />
      </div>
      {/* 利用者向けは必ず元の品番（/C 等は出さない） */}
      <div className="barcode-label-part">{partNumber}</div>
    </div>
  );
}
