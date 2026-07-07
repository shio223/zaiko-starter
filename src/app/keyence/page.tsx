/**
 * KEYENCE連携（データ転送画面へ統合）
 */
import { redirect } from "next/navigation";

export default function KeyencePage() {
  redirect("/data-transfer");
}
