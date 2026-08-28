/**
 * Brother QL-700 62mmロール向けバーコードラベル設定
 * 現場確認済み: Code-39 / 品番(part_number) / 可変長
 */
export type BarcodeFormat = "CODE39" | "CODE128" | "EAN13";

export const BARCODE_LABEL_CONFIG = {
  /** Brother QL-700 62mm幅ロール */
  rollWidthMm: 62,
  /** 印刷有効幅（余白・印刷可能領域考慮） */
  labelWidthMm: 58,
  /** 現場確認: 旧Accessで Code-39 選択 */
  format: "CODE39" as BarcodeFormat,
  /** バーコードモジュール幅（視認性・読取性向上） */
  width: 1.8,
  /** バーコード高さ（px） */
  height: 52,
  /** 品番はラベル下部に別表示するため、バーコード内の文字は出さない */
  displayValue: false,
  fontSize: 12,
  margin: 0,
} as const;
