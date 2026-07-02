/** 操作完了メッセージの表示 */
type MasterNoticeProps = {
  message: string;
  variant?: "success" | "error";
};

export function MasterNotice({
  message,
  variant = "success",
}: MasterNoticeProps) {
  return (
    <div
      className={`master-notice ${variant === "success" ? "master-notice-success" : "master-notice-error"}`}
      role="status"
    >
      {message}
    </div>
  );
}

/** URLパラメータ notice の値を日本語メッセージに変換 */
export function getNoticeMessage(notice: string | null): string | null {
  switch (notice) {
    case "created":
      return "製品を登録しました。";
    case "updated":
      return "製品を更新しました。";
    case "deleted":
      return "製品を削除しました。";
    case "shelf_created":
      return "棚番を登録しました。";
    case "shelf_updated":
      return "棚番を更新しました。";
    case "shelf_deleted":
      return "棚番を削除しました。";
    default:
      return null;
  }
}
