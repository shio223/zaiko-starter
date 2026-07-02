/** データ転送（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function DataTransferPage() {
  return (
    <AppLayout>
      <PageHeader title="データ転送" />
      <PlaceholderPage
        title="データ転送"
        description="データ転送機能は今後実装予定です。"
      />
    </AppLayout>
  );
}
