/**
 * 在庫リスト画面
 * 左: 検索・絞り込み / 右: 一覧表
 * Supabase の products テーブルからデータを取得
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AccessButton } from "@/components/ui/AccessButton";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
import { filterProducts } from "@/lib/utils/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { Product, SearchFilter } from "@/lib/types/product";
import Link from "next/link";

/** 検索条件の初期値（すべて空 = 全件表示） */
const defaultFilter: SearchFilter = {
  partNumber: "",
  productName: "",
  shelfNumber: "",
  supplier: "",
  mode: "AND",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<SearchFilter>(defaultFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Supabase から製品一覧を読み込む */
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

  return (
    <AppLayout>
      <PageHeader title="在庫リスト">
        <AccessButton variant="green" onClick={loadProducts} disabled={loading}>
          更新
        </AccessButton>
        <Link href="/master">
          <AccessButton variant="blue">マスタ保守</AccessButton>
        </Link>
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
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">
              読み込み中...
            </div>
          ) : (
            <InventoryTable
              products={filteredProducts}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
