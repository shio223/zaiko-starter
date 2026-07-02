/** バーコード印刷（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function BarcodePage() {
  return (
    <AppLayout>
      <PageHeader title="バーコード印刷" />
      <PlaceholderPage
        title="バーコード印刷"
        description="KEYENCEハンディ連携・バーコード印刷機能は今後実装予定です。"
      />
    </AppLayout>
  );
}
