"use client";

import { useRouter } from "next/navigation";

/** マスタ保守のタブ種別 */
export type MasterTab = "shelf" | "product" | "person";

type MasterTabNavProps = {
  active: MasterTab;
};

const tabs: { id: MasterTab; label: string }[] = [
  { id: "shelf", label: "棚番マスタ" },
  { id: "product", label: "製品マスタ" },
  { id: "person", label: "担当者マスタ" },
];

/**
 * マスタ保守のタブ切り替え（Access版と同じ3タブ）
 * 製品マスタ以外は一覧画面へ遷移
 */
export function MasterTabNav({ active }: MasterTabNavProps) {
  const router = useRouter();

  const handleTab = (tab: MasterTab) => {
    router.push(`/master?tab=${tab}`);
  };

  return (
    <div className="master-tabs" role="tablist" aria-label="マスタ保守">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`master-tab ${active === tab.id ? "master-tab-active" : ""}`}
          onClick={() => handleTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
