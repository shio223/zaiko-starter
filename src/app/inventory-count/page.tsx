/** 棚卸リスト（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function InventoryCountPage() {
  return (
    <AppLayout>
      <PageHeader title="棚卸リスト" />
      <PlaceholderPage title="棚卸リスト" />
    </AppLayout>
  );
}
