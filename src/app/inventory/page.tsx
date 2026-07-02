/**
 * 在庫リスト画面
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { SelectedProductPanel } from "@/components/inventory/SelectedProductPanel";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { AccessButton } from "@/components/ui/AccessButton";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
import { performStockMovement } from "@/lib/supabase/stock-movements";
import { filterProducts } from "@/lib/utils/product";
import { exportProductsToCsv } from "@/lib/utils/product-export";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { Product, SearchFilter } from "@/lib/types/product";

const defaultFilter: SearchFilter = {
  partNumber: "",
  productName: "",
  shelfNumber: "",
  supplier: "",
  mode: "AND",
};

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<SearchFilter>(defaultFilter);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<"in" | "out" | null>(null);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase（Zaiko STARTER）が未設定です。.env.local に接続情報を設定してください。"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
      setSelectedId((current) => {
        if (!current) return null;
        return data.find((p) => p.id === current)?.id ?? null;
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

  const filteredProducts = useMemo(() => {
    const searched = filterProducts(products, filter);
    if (!showLowStockOnly) {
      return searched;
    }
    return searched.filter(
      (p) => p.reorder_point > 0 && p.quantity <= p.reorder_point
    );
  }, [products, filter, showLowStockOnly]);

  const selectedProduct =
    products.find((p) => p.id === selectedId) ?? null;

  const handleMovement = async (quantity: number, memo: string) => {
    if (!selectedProduct || !movementType) return;
    await performStockMovement({
      productId: selectedProduct.id,
      movementType,
      quantity,
      memo,
    });
    setMovementType(null);
    await loadProducts();
  };

  return (
    <AppLayout>
      <PageHeader title="在庫リスト">
        <AccessButton
          variant="green"
          onClick={() => selectedProduct && setMovementType("in")}
          disabled={!selectedProduct}
        >
          入庫
        </AccessButton>
        <AccessButton
          variant="blue"
          onClick={() => selectedProduct && setMovementType("out")}
          disabled={!selectedProduct}
        >
          出庫
        </AccessButton>
        <AccessButton
          variant="blue"
          onClick={() =>
            selectedProduct &&
            router.push(`/master/${selectedProduct.id}/edit`)
          }
          disabled={!selectedProduct}
        >
          編集
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => exportProductsToCsv(filteredProducts)}
          disabled={filteredProducts.length === 0}
        >
          CSV出力
        </AccessButton>
        <AccessButton variant="orange" onClick={loadProducts} disabled={loading}>
          更新
        </AccessButton>
        <Link href="/master?tab=product">
          <AccessButton variant="blue">マスタ保守</AccessButton>
        </Link>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <div className="content-sidebar-stack">
          <SearchFilterPanel
            filter={filter}
            onChange={setFilter}
            onClear={() => setFilter(defaultFilter)}
          />
          <SelectedProductPanel product={selectedProduct} />
          <label className="access-panel p-3 text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
            />
            発注点以下のみ表示
          </label>
        </div>

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {filteredProducts.length} / {products.length} 件
            {selectedProduct && (
              <span className="content-summary-selected">
                選択中: {selectedProduct.part_number} -{" "}
                {selectedProduct.product_name}
              </span>
            )}
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

      {selectedProduct && movementType && (
        <StockMovementDialog
          product={selectedProduct}
          type={movementType}
          onConfirm={handleMovement}
          onCancel={() => setMovementType(null)}
        />
      )}
    </AppLayout>
  );
}
