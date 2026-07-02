/**
 * 製品マスタ編集画面
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterTabNav } from "@/components/master/MasterTabNav";
import { ProductForm } from "@/components/master/ProductForm";
import { AccessButton } from "@/components/ui/AccessButton";
import { fetchProductById, isSupabaseConfigured } from "@/lib/supabase/client";
import { productToFormData } from "@/lib/utils/product";
import { saveExistingProduct } from "@/lib/utils/save-product";
import { emptyProductForm } from "@/lib/types/product";
import type { ProductFormData } from "@/lib/types/product";
import type { ProductFormErrors } from "@/lib/utils/product-validation";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

export default function MasterEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
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
    setSaving(true);
    setError(null);
    setFormErrors({});

    const result = await saveExistingProduct(id, formData);

    if (result.ok) {
      router.push("/master?tab=product&notice=updated");
      return;
    }

    if ("errors" in result && result.errors) {
      setFormErrors(result.errors);
    } else if ("message" in result && result.message) {
      setError(result.message);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="マスタ保守 - 製品マスタ 編集" />
        <MasterTabNav active="product" />
        <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="マスタ保守 - 製品マスタ 編集">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "更新中..." : "更新"}
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => router.push("/master?tab=product")}
        >
          キャンセル
        </AccessButton>
      </PageHeader>

      <MasterTabNav active="product" />

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ProductForm
        data={formData}
        onChange={setFormData}
        errors={formErrors}
        disabled={saving}
      />
    </AppLayout>
  );
}
