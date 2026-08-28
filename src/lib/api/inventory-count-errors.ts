/**
 * 棚卸確定 RPC エラーを利用者向けメッセージに変換
 */
const SAFE_BUSINESS_ERRORS: RegExp[] = [
  /^棚卸が指定されていません。$/,
  /^棚卸が見つかりません。$/,
  /^この棚卸は既に確定済みです。$/,
  /^この棚卸は確定できません。$/,
  /^未入力の商品が\d+件あります$/,
  /^製品マスタに紐づかない明細が\d+件あります$/,
  /^実棚数がマイナスの商品が\d+件あります$/,
  /^実棚数は0以上で入力してください/,
  /^対象の製品が見つかりません/,
  /^現在庫が不足しています/,
];

export function mapInventoryCountError(message: string): string {
  const trimmed = message.trim();
  if (SAFE_BUSINESS_ERRORS.some((pattern) => pattern.test(trimmed))) {
    return trimmed;
  }
  return "棚卸の確定に失敗しました。";
}
