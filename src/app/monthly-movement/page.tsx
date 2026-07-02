/** 月別移動量（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function MonthlyMovementPage() {
  return (
    <AppLayout>
      <PageHeader title="月別移動量" />
      <PlaceholderPage title="月別移動量" />
    </AppLayout>
  );
}
