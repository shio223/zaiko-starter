"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { KeyenceManualInputDialog } from "@/components/keyence/KeyenceManualInputDialog";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parseKeyenceFile } from "@/lib/utils/keyence-parser";
import {
  applyKeyenceRows,
  createManualKeyenceRow,
  validateKeyenceRows,
} from "@/lib/utils/keyence-import";
import { downloadKeyenceResultTemplate } from "@/lib/utils/product-export";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type {
  KeyenceApplyResult,
  KeyenceImportRow,
  KeyenceImportStep,
  KeyenceRowIssue,
  KeyenceValidationResult,
} from "@/lib/types/keyence-import";

function getRowIssues(
  rowId: string,
  issues: KeyenceRowIssue[]
): KeyenceRowIssue[] {
  return issues.filter((i) => i.rowId === rowId);
}

function movementLabel(type: string | null): string {
  if (type === "in") return "入庫";
  if (type === "out") return "出庫";
  return "-";
}

/** KEYENCE BT-600 データ転送パネル（Access風） */
export function KeyenceDataTransferPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<KeyenceImportStep>("ready");
  const [statusMessage, setStatusMessage] = useState(
    "BT-600を通信ユニットにしっかりセットして、「取り込み」ボタンをクリックしてください。"
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [rows, setRows] = useState<KeyenceImportRow[]>([]);
  const [validation, setValidation] = useState<KeyenceValidationResult | null>(
    null
  );
  const [applyResult, setApplyResult] = useState<KeyenceApplyResult | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);

  const resetState = useCallback(() => {
    setStep("ready");
    setStatusMessage(
      "BT-600を通信ユニットにしっかりセットして、「取り込み」ボタンをクリックしてください。"
    );
    setFileName(null);
    setParseErrors([]);
    setRows([]);
    setValidation(null);
    setApplyResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const runValidation = useCallback(async (targetRows: KeyenceImportRow[]) => {
    const result = await validateKeyenceRows(targetRows);
    setValidation(result);
    setRows(result.rows);
    setStep("preview");
    setStatusMessage(
      `解析完了: ${result.rows.length} 件（有効 ${result.validCount} / エラー ${result.errorCount} / 警告 ${result.warningCount}）`
    );
    return result;
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      return;
    }

    try {
      setStep("parsing");
      setError(null);
      setApplyResult(null);
      setStatusMessage(`ファイルを解析中: ${file.name}`);

      const parsed = await parseKeyenceFile(file);
      setFileName(parsed.fileName);
      setParseErrors(parsed.parseErrors);

      if (parsed.rows.length === 0) {
        setStep("ready");
        setStatusMessage("取り込めるデータがありません。");
        setError(
          parsed.parseErrors.join(" ") || "ファイルに有効なデータがありません。"
        );
        return;
      }

      setRows(parsed.rows);
      await runValidation(parsed.rows);
    } catch (err) {
      setStep("ready");
      setError(err instanceof Error ? err.message : "ファイル解析に失敗しました。");
      setStatusMessage("取り込みに失敗しました。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleManualAdd = async (
    input: Omit<KeyenceImportRow, "id" | "lineNumber" | "source">
  ) => {
    const manualRow = createManualKeyenceRow(input);
    const nextRows = [...rows, manualRow];
    setShowManual(false);
    setFileName(fileName ?? "手動入力");
    await runValidation(nextRows);
  };

  const handleConfirmApply = async () => {
    if (!validation) return;

    if (validation.errorCount > 0) {
      const proceed = window.confirm(
        `エラーが ${validation.errorCount} 件あります。エラー行を除いて反映しますか？`
      );
      if (!proceed) return;
    } else {
      const proceed = window.confirm(
        `${validation.validCount} 件を在庫へ反映します。よろしいですか？`
      );
      if (!proceed) return;
    }

    try {
      setStep("applying");
      setStatusMessage("Supabaseへ反映中...");
      setError(null);

      const result = await applyKeyenceRows(rows, validation.issues);
      setApplyResult(result);
      setStep("done");
      setStatusMessage(
        `反映完了: 成功 ${result.success} 件 / 失敗 ${result.failed} 件`
      );
    } catch (err) {
      setError(formatSupabaseError(err));
      setStep("preview");
      setStatusMessage("反映に失敗しました。");
    }
  };

  const issues = validation?.issues ?? [];

  return (
    <>
      <AccessPanel title="KEYENCE BT-600 データ転送" className="keyence-panel">
        <p className="keyence-guide text-sm mb-3">
          BT-600を通信ユニットにしっかりセットして、「取り込み」ボタンをクリックしてください。
        </p>
        <p className="text-sm mb-3 keyence-status">{statusMessage}</p>

        <div className="page-header-actions mb-3">
          <AccessButton
            variant="green"
            onClick={() => fileInputRef.current?.click()}
            disabled={step === "parsing" || step === "applying"}
          >
            取り込み
          </AccessButton>
          <AccessButton
            variant="blue"
            onClick={() => setShowManual(true)}
            disabled={step === "parsing" || step === "applying"}
          >
            手動入力
          </AccessButton>
          <AccessButton variant="orange" onClick={() => router.push("/")}>
            閉じる
          </AccessButton>
          <AccessButton variant="blue" onClick={downloadKeyenceResultTemplate}>
            仮テンプレート
          </AccessButton>
          {(step === "preview" || step === "done") && (
            <AccessButton variant="orange" onClick={resetState}>
              リセット
            </AccessButton>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,text/csv,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelect(file);
            }
          }}
        />

        {fileName && (
          <p className="text-sm mb-2">
            ファイル: {fileName}
            {validation && (
              <span>
                {" "}
                / 重複グループ: {validation.duplicateGroups.length} 件
              </span>
            )}
          </p>
        )}

        {parseErrors.length > 0 && (
          <div className="access-panel mb-3 border-2 border-orange-500 p-3 text-sm">
            <p className="font-bold mb-1">解析メモ</p>
            <ul>
              {parseErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "preview" && validation && (
          <div className="mb-3">
            <AccessButton
              variant="green"
              onClick={handleConfirmApply}
              disabled={validation.validCount === 0}
            >
              確定して反映
            </AccessButton>
          </div>
        )}

        {(step === "preview" || step === "done") && rows.length > 0 && (
          <div className="table-scroll-wrapper access-panel">
            <table className="access-table">
              <thead>
                <tr>
                  <th>行</th>
                  <th>品番</th>
                  <th>品名</th>
                  <th>棚番</th>
                  <th>区分</th>
                  <th>数量</th>
                  <th>備考</th>
                  <th>状態</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowIssues = getRowIssues(row.id, issues);
                  const hasError = rowIssues.some((i) => i.level === "error");
                  const hasWarning = rowIssues.some((i) => i.level === "warning");

                  return (
                    <tr
                      key={row.id}
                      className={
                        hasError
                          ? "row-import-error"
                          : hasWarning
                            ? "row-import-warning"
                            : ""
                      }
                    >
                      <td>{row.lineNumber || "手動"}</td>
                      <td>{row.part_number}</td>
                      <td>{row.product_name}</td>
                      <td>{row.shelf_number}</td>
                      <td>{movementLabel(row.movement_type)}</td>
                      <td className="text-right">{row.quantity ?? "-"}</td>
                      <td>{row.memo}</td>
                      <td className="text-xs">
                        {rowIssues.length === 0
                          ? "OK"
                          : rowIssues.map((i) => i.message).join(" / ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {applyResult && (
          <AccessPanel title="取り込み結果" className="mt-3">
            <p className="text-sm">
              成功: {applyResult.success} 件 / 失敗: {applyResult.failed} 件
            </p>
            {applyResult.errors.length > 0 && (
              <ul className="mt-2 text-sm text-red-700 max-h-40 overflow-y-auto">
                {applyResult.errors.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          </AccessPanel>
        )}

        <p className="text-xs mt-3 text-gray-700">
          ※ BT-600の実ファイル形式は未確定のため、CSV/TXTの仮パーサーで動作します。
          実機確認後にパーサーを差し替えます。
        </p>
      </AccessPanel>

      {showManual && (
        <KeyenceManualInputDialog
          onAdd={handleManualAdd}
          onCancel={() => setShowManual(false)}
        />
      )}
    </>
  );
}
