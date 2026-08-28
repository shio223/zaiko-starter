/**
 * バーコード印刷画面
 * Brother QL-700（62mmロール）向け
 * 操作: 棚番選択 → 商品一覧 → チェック → 枚数 → プレビュー → 印刷
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
  department: "",
  mode: "AND",
};

/** shelf_code の DISTINCT（文字列ソート、先頭ゼロ保持） */
function distinctShelfCodes(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    const shelf = p.shelf_code;
    if (shelf !== undefined && shelf !== null && String(shelf) !== "") {
      set.add(String(shelf));
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "ja"));
}

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

  const shelfOptions = useMemo(
    () => distinctShelfCodes(products),
    [products]
  );

  const selectedShelf = filter.shelfNumber;

  /** 棚番選択後: その棚の商品のみ。未選択時は空 */
  const productsOnShelf = useMemo(() => {
    if (!selectedShelf) {
      return [];
    }
    return products.filter((p) => String(p.shelf_code) === selectedShelf);
  }, [products, selectedShelf]);

  /** 棚内で品番・品名などの追加絞り込み（棚番条件は除外） */
  const filteredProducts = useMemo(() => {
    if (!selectedShelf) {
      return [];
    }
    return filterProducts(productsOnShelf, {
      ...filter,
      shelfNumber: "",
    });
  }, [productsOnShelf, filter, selectedShelf]);

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

  const handleFilterChange = (next: SearchFilter) => {
    const shelfChanged = next.shelfNumber !== filter.shelfNumber;
    setFilter(next);
    if (shelfChanged) {
      setSelectedIds(new Set());
    }
  };

  const handleClearFilter = () => {
    setFilter(defaultFilter);
    setSelectedIds(new Set());
  };

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
            onChange={handleFilterChange}
            onClear={handleClearFilter}
            shelfOptions={shelfOptions}
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
              QL-700 {BARCODE_LABEL_CONFIG.labelWidthMm}mmロール /
              Code-39 / 倍率100%・余白なし
            </p>
          </AccessPanel>
        </div>

        <div className="content-main">
          <div className="text-sm content-summary">
            {selectedShelf
              ? `棚番: ${selectedShelf} / 選択: ${selectedProducts.length} / 表示: ${filteredProducts.length} 件`
              : "棚番を選択してください"}
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : !selectedShelf ? (
            <div className="access-panel p-4 text-center text-sm">
              左側で棚番を選択すると、その棚の商品一覧が表示されます。
            </div>
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
                        <td>{p.shelf_code}</td>
                        <td>{p.part_number}</td>
                        <td>{p.name}</td>
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
              productName={product.name}
              shelfNumber={product.shelf_code}
            />
          ))
        )}
      </div>
    </AppLayout>
  );
}
