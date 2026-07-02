/** 棚卸開始（未実装・画面のみ） */
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export default function InventoryStartPage() {
  return (
    <AppLayout>
      <PageHeader title="棚卸開始" />
      <PlaceholderPage
        title="棚卸開始"
        description="棚卸処理機能は今後実装予定です。"
      />
    </AppLayout>
  );
}
