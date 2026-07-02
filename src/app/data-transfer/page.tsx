/**
 * データ転送画面（CSV入出力）
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
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

export default function DataTransferPage() {
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
      exportProductsToCsv(products, `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownloadTemplate = () => {
    downloadCsv("products_import_template.csv", getProductImportTemplateRows());
  };

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
    <AppLayout>
      <PageHeader title="データ転送">
        <AccessButton variant="green" onClick={handleExport} disabled={loading}>
          在庫データ出力
        </AccessButton>
        <AccessButton variant="blue" onClick={handleDownloadTemplate}>
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
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="data-transfer-grid">
        <AccessPanel title="エクスポート（出力）">
          <p className="text-sm mb-3">
            現在の在庫データ（products）を CSV ファイルでダウンロードします。
            Access からの移行やバックアップに利用できます。
          </p>
          <AccessButton variant="green" onClick={handleExport} disabled={loading}>
            在庫データを出力
          </AccessButton>
        </AccessPanel>

        <AccessPanel title="インポート（取込）">
          <p className="text-sm mb-3">
            CSV ファイルから在庫データを取り込みます。品番が一致する場合は更新、
            新しい品番は新規登録されます。
          </p>
          <AccessButton
            variant="orange"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            CSVファイルを選択
          </AccessButton>
        </AccessPanel>
      </div>

      {result && (
        <AccessPanel title="取込結果" className="mt-3">
          <p className="text-sm">
            新規: {result.created} 件 / 更新: {result.updated} 件 / スキップ:{" "}
            {result.skipped} 件
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 text-sm text-red-700 max-h-40 overflow-y-auto">
              {result.errors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          )}
        </AccessPanel>
      )}
    </AppLayout>
  );
}
