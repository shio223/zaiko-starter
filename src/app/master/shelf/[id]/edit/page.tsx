/**
 * 棚番マスタ編集画面
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MasterTabNav } from "@/components/master/MasterTabNav";
import { ShelfForm } from "@/components/master/ShelfForm";
import { AccessButton } from "@/components/ui/AccessButton";
import { fetchShelfById } from "@/lib/supabase/shelves";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { shelfToFormData } from "@/lib/utils/shelf";
import { saveExistingShelf } from "@/lib/utils/save-shelf";
import { emptyShelfForm } from "@/lib/types/shelf";
import type { ShelfFormData } from "@/lib/types/shelf";
import type { ShelfFormErrors } from "@/lib/utils/shelf-validation";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

export default function ShelfEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState<ShelfFormData>(emptyShelfForm);
  const [formErrors, setFormErrors] = useState<ShelfFormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadShelf = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const shelf = await fetchShelfById(id);
      if (!shelf) {
        setError("指定された棚番が見つかりません。");
        return;
      }
      setFormData(shelfToFormData(shelf));
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setFormErrors({});

    const result = await saveExistingShelf(id, formData);

    if (result.ok) {
      router.push("/master?tab=shelf&notice=shelf_updated");
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
        <PageHeader title="マスタ保守 - 棚番マスタ 編集" />
        <MasterTabNav active="shelf" />
        <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title="マスタ保守 - 棚番マスタ 編集">
        <AccessButton variant="green" onClick={handleSave} disabled={saving}>
          {saving ? "更新中..." : "更新"}
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
