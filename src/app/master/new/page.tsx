/**
 * 製品マスタ新規登録画面
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterTabNav } from "@/components/master/MasterTabNav";
import { ProductForm } from "@/components/master/ProductForm";
import { AccessButton } from "@/components/ui/AccessButton";
import { emptyProductForm } from "@/lib/types/product";
import type { ProductFormData } from "@/lib/types/product";
import { saveNewProduct } from "@/lib/utils/save-product";
import type { ProductFormErrors } from "@/lib/utils/product-validation";

export default function MasterNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ProductFormData>(emptyProductForm);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setFormErrors({});

    const result = await saveNewProduct(formData);

    if (result.ok) {
      router.push("/master?tab=product&notice=created");
      return;
    }

    if ("errors" in result && result.errors) {
      setFormErrors(result.errors);
    } else if ("message" in result && result.message) {
      setError(result.message);
    }

    setSaving(false);
  };

  return (
    <AppLayout>
      <PageHeader title="マスタ保守 - 製品マスタ 新規登録">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "登録中..." : "登録"}
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
