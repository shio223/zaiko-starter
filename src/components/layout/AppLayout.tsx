/** サブ画面共通レイアウト（メインメニューへ戻るボタン付き） */
import type { ReactNode } from "react";
import Link from "next/link";
import { AccessButton } from "@/components/ui/AccessButton";

type AppLayoutProps = {
  children: ReactNode;
  showBackToMenu?: boolean;
};

export function AppLayout({ children, showBackToMenu = true }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <div className="app-layout-inner">
        {showBackToMenu && (
          <div className="mb-2">
            <Link href="/">
              <AccessButton variant="blue">メインメニューへ</AccessButton>
            </Link>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
