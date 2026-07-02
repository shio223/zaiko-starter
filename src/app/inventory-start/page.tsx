/**
 * 棚卸開始画面
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessButton } from "@/components/ui/AccessButton";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessTextarea } from "@/components/ui/AccessTextarea";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createInventoryCount } from "@/lib/supabase/inventory-counts";

export default function InventoryStartPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const count = await createInventoryCount({ title, memo });
      router.push(`/inventory-count/${count.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "棚卸の開始に失敗しました。");
      setCreating(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="棚卸開始">
        <AccessButton variant="green" onClick={handleStart} disabled={creating}>
          {creating ? "作成中..." : "棚卸開始"}
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => router.push("/inventory-count")}
        >
          キャンセル
        </AccessButton>
      </PageHeader>

      <AccessPanel title="棚卸情報" className="product-form-panel">
        <AccessInput
          id="count-title-input"
          label="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 2026年6月 定期棚卸"
          disabled={creating}
        />
        <AccessTextarea
          id="count-memo-input"
          label="備考"
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          disabled={creating}
        />
        <p className="text-sm">
          開始すると、現在の全製品が棚卸明細として登録されます。
        </p>
      </AccessPanel>

      {error && (
        <div className="access-panel mt-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </AppLayout>
  );
}
