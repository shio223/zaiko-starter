/**
 * Brother QL-700 62mmロール向けバーコードラベル設定
 * 現場確認済み: Code-39 / 品番(part_number) / 可変長
 */
export type BarcodeFormat = "CODE39" | "CODE128" | "EAN13";

export const BARCODE_LABEL_CONFIG = {
  /** Brother QL-700 62mm幅テープ */
  labelWidthMm: 62,
  /** 現場確認: 旧Accessで Code-39 選択 */
  format: "CODE39" as BarcodeFormat,
  /** バーコードモジュール幅 */
  width: 1.4,
  /** バーコード高さ（px） */
  height: 48,
  /** 品番はラベル下部に別表示するため、バーコード内の文字は出さない */
  displayValue: false,
  fontSize: 12,
  margin: 0,
} as const;
