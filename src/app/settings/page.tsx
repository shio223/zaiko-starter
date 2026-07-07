/** 環境設定 */
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { ProductCsvTransferPanel } from "@/components/settings/ProductCsvTransferPanel";

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader title="環境設定" />

      <div className="data-transfer-grid">
        <AccessPanel title="連携・機器">
          <p className="text-sm mb-3">
            ハンディ端末・ラベルプリンター関連の画面です。
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/data-transfer">
              <AccessButton variant="orange">データ転送（KEYENCE）</AccessButton>
            </Link>
            <Link href="/barcode">
              <AccessButton variant="blue">バーコード印刷</AccessButton>
            </Link>
          </div>
        </AccessPanel>

        <AccessPanel title="システム情報">
          <dl className="selected-product-dl">
            <dt>システム名</dt>
            <dd>Zaiko STARTER Web版</dd>
            <dt>バージョン</dt>
            <dd>1.0.0</dd>
            <dt>データベース</dt>
            <dd>Supabase（Zaiko STARTER）</dd>
            <dt>ラベルプリンター</dt>
            <dd>Brother QL-700（62mm）</dd>
            <dt>ハンディ端末</dt>
            <dd>KEYENCE BT-600</dd>
          </dl>
        </AccessPanel>
      </div>

      <div className="mt-3">
        <ProductCsvTransferPanel />
      </div>
    </AppLayout>
  );
}
