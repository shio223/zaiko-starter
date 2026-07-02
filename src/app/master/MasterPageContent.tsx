/**
 * マスタ保守画面
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterNotice, getNoticeMessage } from "@/components/master/MasterNotice";
import { MasterTabNav, type MasterTab } from "@/components/master/MasterTabNav";
import { ProductMasterPanel } from "@/components/master/ProductMasterPanel";
import { ShelfMasterPanel } from "@/components/master/ShelfMasterPanel";

function parseTab(value: string | null): MasterTab {
  if (value === "shelf" || value === "person") {
    return value;
  }
  return "product";
}

export default function MasterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
  const noticeMessage = getNoticeMessage(searchParams.get("notice"));

  const handleNotice = (notice: string) => {
    router.replace(`/master?tab=${activeTab}&notice=${notice}`);
  };

  return (
    <AppLayout>
      <PageHeader title="マスタ保守" />

      <MasterTabNav active={activeTab} />

      {noticeMessage && <MasterNotice message={noticeMessage} />}

      {activeTab === "shelf" && <ShelfMasterPanel onNotice={handleNotice} />}

      {activeTab === "person" && (
        <div className="access-panel p-6 text-center text-sm">
          担当者マスタは次の実装予定です。
        </div>
      )}

      {activeTab === "product" && <ProductMasterPanel onNotice={handleNotice} />}
    </AppLayout>
  );
}
