/**
 * バーコード印刷画面
 * Brother QL-700（62mm幅）向け
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchFilterPanel } from "@/components/inventory/SearchFilterPanel";
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel";
import { BarcodePrintPreview } from "@/components/barcode/BarcodePrintPreview";
import { AccessButton } from "@/components/ui/AccessButton";
import { AccessInput } from "@/components/ui/AccessInput";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
import { filterProducts } from "@/lib/utils/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import { BARCODE_LABEL_CONFIG } from "@/lib/barcode/config";
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
  const [copies, setCopies] = useState(1);
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

  const printItems = useMemo(
    () =>
      selectedProducts.map((product) => ({
        product,
        copies: Math.max(1, copies),
      })),
    [selectedProducts, copies]
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
        <AccessButton
          variant="green"
          onClick={selectAll}
          disabled={filteredProducts.length === 0}
        >
          全選択
        </AccessButton>
        <AccessButton
          variant="blue"
          onClick={clearSelection}
          disabled={selectedIds.size === 0}
        >
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
        <Link href="/data-transfer">
          <AccessButton variant="blue">データ転送</AccessButton>
        </Link>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout screen-only">
        <div className="content-sidebar-stack">
          <SearchFilterPanel
            filter={filter}
            onChange={setFilter}
            onClear={() => setFilter(defaultFilter)}
          />
          <AccessPanel title="印刷設定" className="search-filter-panel">
            <AccessInput
              id="barcode-copies"
              label="印刷枚数（各商品）"
              type="number"
              min={1}
              max={99}
              value={copies}
              onChange={(e) =>
                setCopies(Math.max(1, Number(e.target.value) || 1))
              }
            />
            <p className="text-xs">
              ラベル幅: {BARCODE_LABEL_CONFIG.labelWidthMm}mm /
              規格: {BARCODE_LABEL_CONFIG.format}
            </p>
          </AccessPanel>
        </div>

        <div className="content-main">
          <div className="text-sm content-summary">
            選択: {selectedProducts.length} / 表示: {filteredProducts.length} 件
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <>
              <div className="table-scroll-wrapper access-panel mb-3">
                <table className="access-table">
                  <thead>
                    <tr>
                      <th>選択</th>
                      <th>棚番</th>
                      <th>品番</th>
                      <th>品名</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => (
                      <tr
                        key={p.id}
                        className={selectedIds.has(p.id) ? "selected" : ""}
                        onClick={() => toggleSelect(p.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td>{p.shelf_number}</td>
                        <td>{p.part_number}</td>
                        <td>{p.product_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <BarcodePrintPreview items={printItems} />
            </>
          )}
        </div>
      </div>

      <div className="barcode-print-area print-only">
        {printItems.flatMap(({ product, copies: count }) =>
          Array.from({ length: count }, (_, index) => (
            <BarcodeLabel
              key={`${product.id}-print-${index}`}
              partNumber={product.part_number}
              productName={product.product_name}
              shelfNumber={product.shelf_number}
            />
          ))
        )}
      </div>
    </AppLayout>
  );
}
