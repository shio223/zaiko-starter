/**
 * 製品マスタ新規登録画面
 * Access版の製品マスタ新規登録に相当
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/master/ProductForm";
import { AccessButton } from "@/components/ui/AccessButton";
import { createProduct, isSupabaseConfigured } from "@/lib/supabase/client";
import { emptyProductForm } from "@/lib/types/product";
import type { ProductFormData } from "@/lib/types/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

export default function MasterNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** バリデーション後、Supabase に登録 */
  const handleSave = async () => {
    if (!formData.part_number.trim()) {
      alert("品番を入力してください。");
      return;
    }
    if (!formData.product_name.trim()) {
      alert("品名を入力してください。");
      return;
    }

    if (!isSupabaseConfigured()) {
      alert("Supabase（Zaiko STARTER）が未設定です。.env.local を確認してください。");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createProduct(formData);
      router.push("/master");
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="製品マスタ - 新規登録">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "登録中..." : "登録"}
        </AccessButton>
        <AccessButton variant="orange" onClick={() => router.push("/master")}>
          キャンセル
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductForm data={formData} onChange={setFormData} />
    </AppLayout>
  );
}
