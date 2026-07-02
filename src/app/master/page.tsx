/**
 * マスタ保守画面（製品マスタ一覧）
 * 行を選択して編集・削除が可能
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { MasterTable } from "@/components/master/MasterTable";
import { AccessButton } from "@/components/ui/AccessButton";
import {
  deleteProduct,
  fetchProducts,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { filterProducts } from "@/lib/utils/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { Product, SearchFilter } from "@/lib/types/product";

const defaultFilter: SearchFilter = {
  partNumber: "",
  productName: "",
  shelfNumber: "",
  supplier: "",
  mode: "AND",
};

export default function MasterPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<SearchFilter>(defaultFilter);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase（Zaiko STARTER）が未設定です。.env.local に既存プロジェクトの NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = filterProducts(products, filter);

  /** 選択した製品を削除（確認ダイアログあり） */
  const handleDelete = async () => {
    if (!selected) {
      alert("削除する製品を選択してください。");
      return;
    }

    const confirmed = window.confirm(
      `「${selected.product_name}」（品番: ${selected.part_number}）を削除しますか？`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProduct(selected.id);
      setSelected(null);
      await loadProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  /** 選択した製品の編集画面へ遷移 */
  const handleEdit = () => {
    if (!selected) {
      alert("編集する製品を選択してください。");
      return;
    }
    router.push(`/master/${selected.id}/edit`);
  };

  return (
    <AppLayout>
      <PageHeader title="マスタ保守 - 製品マスタ">
        <Link href="/master/new">
          <AccessButton variant="green">新規登録</AccessButton>
        </Link>
        <AccessButton
          variant="blue"
          onClick={handleEdit}
          disabled={!selected}
        >
          編集
        </AccessButton>
        <AccessButton
          variant="red"
          onClick={handleDelete}
          disabled={!selected || deleting}
        >
          {deleting ? "削除中..." : "削除"}
        </AccessButton>
        <AccessButton variant="orange" onClick={loadProducts} disabled={loading}>
          更新
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchFilterPanel
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter(defaultFilter)}
        />

        <div className="flex flex-1 flex-col gap-2">
          <div className="text-sm">
            表示件数: {filteredProducts.length} / {products.length} 件
            {selected && (
              <span className="ml-4">
                選択中: {selected.part_number} - {selected.product_name}
              </span>
            )}
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">
              読み込み中...
            </div>
          ) : (
            <MasterTable
              products={filteredProducts}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
