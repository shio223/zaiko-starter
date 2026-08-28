/**
 * RPC エラーを利用者向けメッセージに変換（内部情報は隠す）
 */
const SAFE_BUSINESS_ERRORS: RegExp[] = [
  /^現在庫が不足しています/,
  /^数量は1以上で入力してください。$/,
  /^対象の製品が指定されていません。$/,
  /^対象の製品が見つかりません。$/,
  /^品番が空です。$/,
  /^品番「.+」は未登録です。$/,
  /^transaction_type は in または out を指定してください。$/,
];

export function mapInventoryTransactionError(message: string): string {
  const trimmed = message.trim();
  if (SAFE_BUSINESS_ERRORS.some((pattern) => pattern.test(trimmed))) {
    return trimmed;
  }
  return "入出庫処理に失敗しました。";
}
