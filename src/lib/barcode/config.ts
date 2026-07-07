/**
 * バーコード設定
 * 実機ラベル確認後は format / width / height 等を変更する
 */
export type BarcodeFormat = "CODE128" | "CODE39" | "EAN13";

export const BARCODE_LABEL_CONFIG = {
  /** Brother QL-700 62mm幅テープ */
  labelWidthMm: 62,
  /** jsbarcode の format（既存ラベル確認後に変更可能） */
  format: "CODE128" as BarcodeFormat,
  width: 1.2,
  height: 40,
  displayValue: true,
  fontSize: 12,
  margin: 2,
} as const;
