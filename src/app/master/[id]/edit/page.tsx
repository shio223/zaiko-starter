/**
 * 製品マスタ編集画面
 * URL の [id] から対象製品を取得してフォームに表示
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProductForm } from "@/components/master/ProductForm";
import { AccessButton } from "@/components/ui/AccessButton";
import {
  fetchProductById,
  isSupabaseConfigured,
  updateProduct,
} from "@/lib/supabase/client";
import { productToFormData } from "@/lib/utils/product";
import { emptyProductForm } from "@/lib/types/product";
import type { ProductFormData } from "@/lib/types/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

export default function MasterEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。.env.local を確認してください。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const product = await fetchProductById(id);
      if (!product) {
        setError("指定された製品が見つかりません。");
        return;
      }
      setFormData(productToFormData(product));
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleSave = async () => {
    if (!formData.part_number.trim()) {
      alert("品番を入力してください。");
      return;
    }
    if (!formData.product_name.trim()) {
      alert("品名を入力してください。");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateProduct(id, formData);
      router.push("/master");
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="製品マスタ - 編集" />
        <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="製品マスタ - 編集">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "更新中..." : "更新"}
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
