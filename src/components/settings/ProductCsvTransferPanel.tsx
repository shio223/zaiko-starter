"use client";

import { useCallback, useRef, useState } from "react";
import { AccessButton } from "@/components/ui/AccessButton";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
import { exportProductsToCsv } from "@/lib/utils/product-export";
import {
  getProductImportTemplateRows,
  importProductsFromCsv,
  type ImportResult,
} from "@/lib/utils/product-import";
import { downloadCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

/** 在庫データのCSV入出力（従来のデータ転送機能） */
export function ProductCsvTransferPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleExport = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const products = await fetchProducts();
      exportProductsToCsv(
        products,
        `products_export_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = async (file: File) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const text = await file.text();
      const importResult = await importProductsFromCsv(text);
      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "インポートに失敗しました。");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <AccessPanel title="在庫データ転送（CSV）">
      <p className="text-sm mb-3">
        製品マスタ・在庫データの一括入出力です。KEYENCE BT-600の取り込みは
        「データ転送」画面を使用してください。
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        <AccessButton variant="green" onClick={handleExport} disabled={loading}>
          在庫データ出力
        </AccessButton>
        <AccessButton
          variant="blue"
          onClick={() =>
            downloadCsv(
              "products_import_template.csv",
              getProductImportTemplateRows()
            )
          }
        >
          取込テンプレート
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          CSV取込
        </AccessButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImport(file);
            }
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-700 mb-2">{error}</p>
      )}

      {result && (
        <p className="text-sm">
          新規: {result.created} 件 / 更新: {result.updated} 件 / スキップ:{" "}
          {result.skipped} 件
        </p>
      )}
    </AccessPanel>
  );
}
