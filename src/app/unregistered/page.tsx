/** 未登録リスト（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function UnregisteredPage() {
  return (
    <AppLayout>
      <PageHeader title="未登録リスト" />
      <PlaceholderPage title="未登録リスト" />
    </AppLayout>
  );
}
