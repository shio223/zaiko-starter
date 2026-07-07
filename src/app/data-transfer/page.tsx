/**
 * データ転送画面（KEYENCE BT-600）
 * Access版の「データ転送」に相当
 */
"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyenceDataTransferPanel } from "@/components/keyence/KeyenceDataTransferPanel";

export default function DataTransferPage() {
  return (
    <AppLayout showBackToMenu={false}>
      <PageHeader title="データ転送" />
      <KeyenceDataTransferPanel />
    </AppLayout>
  );
}
