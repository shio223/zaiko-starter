/**
 * 棚番マスタ新規登録画面
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterTabNav } from "@/components/master/MasterTabNav";
import { ShelfForm } from "@/components/master/ShelfForm";
import { AccessButton } from "@/components/ui/AccessButton";
import { emptyShelfForm } from "@/lib/types/shelf";
import type { ShelfFormData } from "@/lib/types/shelf";
import { saveNewShelf } from "@/lib/utils/save-shelf";
import type { ShelfFormErrors } from "@/lib/utils/shelf-validation";

export default function ShelfNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ShelfFormData>(emptyShelfForm);
  const [formErrors, setFormErrors] = useState<ShelfFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setFormErrors({});

    const result = await saveNewShelf(formData);

    if (result.ok) {
      router.push("/master?tab=shelf&notice=shelf_created");
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
      <PageHeader title="マスタ保守 - 棚番マスタ 新規登録">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "登録中..." : "登録"}
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => router.push("/master?tab=shelf")}
        >
          キャンセル
        </AccessButton>
      </PageHeader>

      <MasterTabNav active="shelf" />

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <ShelfForm
        data={formData}
        onChange={setFormData}
        errors={formErrors}
        disabled={saving}
      />
    </AppLayout>
  );
}
