/** 入出庫履歴（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function HistoryPage() {
  return (
    <AppLayout>
      <PageHeader title="入出庫履歴" />
      <PlaceholderPage title="入出庫履歴" />
    </AppLayout>
  );
}
