"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { MasterTable } from "@/components/master/MasterTable";
import { AccessButton } from "@/components/ui/AccessButton";
import {
  deleteProduct,
  fetchProducts,
  isSupabaseConfigured,
} from "@/lib/supabase/client";
import { filterProducts } from "@/lib/utils/product";
import { formatProductSaveError } from "@/lib/utils/product-validation";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { Product, SearchFilter } from "@/lib/types/product";

const defaultFilter: SearchFilter = {
  partNumber: "",
  productName: "",
  shelfNumber: "",
  supplier: "",
  department: "",
  mode: "AND",
};

type ProductMasterPanelProps = {
  onNotice: (notice: string) => void;
};

/** 製品マスタ一覧パネル */
export function ProductMasterPanel({ onNotice }: ProductMasterPanelProps) {
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
        "Supabase（Zaiko STARTER）が未設定です。Vercel の Environment Variables を確認してください。"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
      setSelected((current) => {
        if (!current) return null;
        return data.find((p) => p.id === current.id) ?? null;
      });
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

  const goToEdit = (product: Product) => {
    router.push(`/master/${product.id}/edit`);
  };

  const handleDelete = async () => {
    if (!selected) {
      alert("削除する製品を選択してください。");
      return;
    }

    const confirmed = window.confirm(
      `「${selected.name}」（品番: ${selected.part_number}）を削除しますか？`
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteProduct(selected.id);
      setSelected(null);
      onNotice("deleted");
      await loadProducts();
    } catch (err) {
      alert(formatProductSaveError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header-actions mb-3">
        <Link href="/master/new">
          <AccessButton variant="green">新規登録</AccessButton>
        </Link>
        <AccessButton
          variant="blue"
          onClick={() => selected && goToEdit(selected)}
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
      </div>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <SearchFilterPanel
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter(defaultFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {filteredProducts.length} / {products.length} 件
            {selected && (
              <span className="content-summary-selected">
                選択中: {selected.part_number} - {selected.name}
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
              onEdit={goToEdit}
            />
          )}
        </div>
      </div>
    </>
  );
}
