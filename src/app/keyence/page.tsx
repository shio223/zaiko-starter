/**
 * KEYENCE連携画面
 */
"use client";

import { useCallback, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessButton } from "@/components/ui/AccessButton";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { fetchProducts, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  downloadKeyenceResultTemplate,
  exportKeyenceMasterCsv,
} from "@/lib/utils/product-export";
import { performStockMovementByPartNumber } from "@/lib/supabase/stock-movements";
import { getCsvColumnIndex, parseCsv } from "@/lib/utils/csv";
import { formatSupabaseError } from "@/lib/utils/supabase-error";

type KeyenceImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export default function KeyencePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KeyenceImportResult | null>(null);

  const handleExportMaster = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const products = await fetchProducts();
      exportKeyenceMasterCsv(products);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImportResults = async (file: File) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        throw new Error("CSVにデータ行がありません。");
      }

      const headers = rows[0];
      const partIndex = getCsvColumnIndex(headers, [
        "part_number",
        "品番",
        "barcode",
      ]);
      const typeIndex = getCsvColumnIndex(headers, [
        "movement_type",
        "区分",
        "type",
      ]);
      const qtyIndex = getCsvColumnIndex(headers, ["quantity", "数量"]);
      const memoIndex = getCsvColumnIndex(headers, ["memo", "備考"]);

      if (partIndex < 0 || typeIndex < 0 || qtyIndex < 0) {
        throw new Error(
          "CSVに必要な列（part_number, movement_type, quantity）がありません。"
        );
      }

      const importResult: KeyenceImportResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i];
        const partNumber = row[partIndex]?.trim() ?? "";
        const typeRaw = row[typeIndex]?.trim().toLowerCase() ?? "";
        const quantity = Number(row[qtyIndex]);
        const memo = memoIndex >= 0 ? (row[memoIndex]?.trim() ?? "") : "";

        if (!partNumber || !Number.isFinite(quantity) || quantity <= 0) {
          importResult.failed += 1;
          importResult.errors.push(`${i + 1}行目: 品番または数量が不正です`);
          continue;
        }

        const movementType =
          typeRaw === "in" || typeRaw === "入庫" || typeRaw === "入"
            ? "in"
            : typeRaw === "out" || typeRaw === "出庫" || typeRaw === "出"
              ? "out"
              : null;

        if (!movementType) {
          importResult.failed += 1;
          importResult.errors.push(`${i + 1}行目: 区分が不正です（in/out）`);
          continue;
        }

        try {
          await performStockMovementByPartNumber({
            partNumber,
            movementType,
            quantity,
            memo: memo || "KEYENCE取込",
          });
          importResult.success += 1;
        } catch (err) {
          importResult.failed += 1;
          const message = err instanceof Error ? err.message : "不明なエラー";
          importResult.errors.push(`${i + 1}行目: ${message}`);
        }
      }

      setResult(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "取込に失敗しました。");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <AppLayout>
      <PageHeader title="KEYENCE連携">
        <AccessButton variant="green" onClick={handleExportMaster} disabled={loading}>
          マスタ出力
        </AccessButton>
        <AccessButton variant="blue" onClick={downloadKeyenceResultTemplate}>
          取込テンプレート
        </AccessButton>
        <AccessButton
          variant="orange"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          スキャン結果取込
        </AccessButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleImportResults(file);
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
        <AccessPanel title="ハンディへマスタ送信">
          <p className="text-sm mb-3">
            品番・品名・棚番・在庫数を CSV で出力します。
            KEYENCE ハンディ端末へマスタデータとして転送してください。
          </p>
          <AccessButton variant="green" onClick={handleExportMaster} disabled={loading}>
            マスタCSVを出力
          </AccessButton>
        </AccessPanel>

        <AccessPanel title="スキャン結果の取込">
          <p className="text-sm mb-3">
            ハンディでスキャンした入出庫結果（CSV）を取り込み、
            在庫数と入出庫履歴を更新します。
          </p>
          <p className="text-sm mb-3">
            CSV列: part_number, movement_type（in/out）, quantity, memo
          </p>
          <AccessButton
            variant="orange"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            スキャン結果CSVを選択
          </AccessButton>
        </AccessPanel>
      </div>

      {result && (
        <AccessPanel title="取込結果" className="mt-3">
          <p className="text-sm">
            成功: {result.success} 件 / 失敗: {result.failed} 件
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
