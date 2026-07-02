/**
 * バーコード印刷画面
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel";
import { AccessButton } from "@/components/ui/AccessButton";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
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

export default function BarcodePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<SearchFilter>(defaultFilter);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
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

  const filteredProducts = useMemo(
    () => filterProducts(products, filter),
    [products, filter]
  );

  const selectedProducts = filteredProducts.filter((p) =>
    selectedIds.has(p.id)
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <PageHeader title="バーコード印刷">
        <AccessButton variant="green" onClick={selectAll} disabled={filteredProducts.length === 0}>
          全選択
        </AccessButton>
        <AccessButton variant="blue" onClick={clearSelection} disabled={selectedIds.size === 0}>
          選択解除
        </AccessButton>
        <AccessButton
          variant="green"
          onClick={handlePrint}
          disabled={selectedProducts.length === 0}
        >
          印刷
        </AccessButton>
        <AccessButton variant="orange" onClick={loadProducts} disabled={loading}>
          更新
        </AccessButton>
        <Link href="/keyence">
          <AccessButton variant="blue">KEYENCE連携</AccessButton>
        </Link>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout screen-only">
        <SearchFilterPanel
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter(defaultFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            選択: {selectedProducts.length} / 表示: {filteredProducts.length} 件
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <div className="table-scroll-wrapper access-panel">
              <table className="access-table">
                <thead>
                  <tr>
                    <th>選択</th>
                    <th>品番</th>
                    <th>品名</th>
                    <th>棚番</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td>{p.part_number}</td>
                      <td>{p.product_name}</td>
                      <td>{p.shelf_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="barcode-print-area print-only">
        {selectedProducts.map((p) => (
          <BarcodeLabel
            key={p.id}
            partNumber={p.part_number}
            productName={p.product_name}
            shelfNumber={p.shelf_number}
          />
        ))}
      </div>
    </AppLayout>
  );
}
