/** 環境設定（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader title="環境設定" />
      <PlaceholderPage title="環境設定" />
    </AppLayout>
  );
}
