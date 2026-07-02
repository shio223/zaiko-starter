/** 環境設定 */
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessButton } from "@/components/ui/AccessButton";

export default function SettingsPage() {
  return (
    <AppLayout>
      <PageHeader title="環境設定" />

      <div className="data-transfer-grid">
        <AccessPanel title="連携・転送">
          <p className="text-sm mb-3">
            データの入出力や外部機器との連携は以下の画面から行います。
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/data-transfer">
              <AccessButton variant="orange">データ転送</AccessButton>
            </Link>
            <Link href="/keyence">
              <AccessButton variant="green">KEYENCE連携</AccessButton>
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
          </dl>
        </AccessPanel>
      </div>
    </AppLayout>
  );
}
