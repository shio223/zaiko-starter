/**
 * Supabase 通信エラーをユーザー向けの日本語メッセージに変換
 */
export function formatSupabaseError(err: unknown): string {
  if (!(err instanceof Error)) {
    return "データの取得に失敗しました";
  }

  const message = err.message;

  // ブラウザのネットワークエラー（開発サーバー再起動が必要な場合あり）
  if (
    message === "Load failed" ||
    message === "Failed to fetch" ||
    message.includes("NetworkError") ||
    message.includes("fetch failed")
  ) {
    return "Supabaseへの接続に失敗しました。ターミナルで npm run dev を一度止めて（Ctrl+C）、再起動してください。";
  }

  // .env.local 未設定または dev サーバー再起動忘れ
  if (message === "Supabase is not configured") {
    return "Supabase（Zaiko STARTER）が未設定です。.env.local を確認し、npm run dev を再起動してください。";
  }

  return message;
}
