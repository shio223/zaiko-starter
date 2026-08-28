"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessPanel } from "@/components/ui/AccessPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { KeyenceManualInputDialog } from "@/components/keyence/KeyenceManualInputDialog";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parseKeyenceFile } from "@/lib/utils/keyence-parser";
import {
  applyKeyenceImport,
  createManualKeyenceRow,
  hashKeyenceFileContent,
  isKeyenceFileAlreadyImported,
  validateKeyenceRows,
} from "@/lib/utils/keyence-import";
import { downloadKeyenceResultTemplate } from "@/lib/utils/product-export";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  KEYENCE_DUPLICATE_FILE_MESSAGE,
  type KeyenceApplyResult,
  type KeyenceImportRow,
  type KeyenceImportStep,
  type KeyenceRowIssue,
  type KeyenceValidationResult,
} from "@/lib/types/keyence-import";

function getRowIssues(
  rowId: string,
  issues: KeyenceRowIssue[]
): KeyenceRowIssue[] {
  return issues.filter((i) => i.rowId === rowId);
}

function movementLabel(row: KeyenceImportRow): string {
  if (row.mode === 3) return "棚卸";
  if (row.movement_type === "in") return "入庫";
  if (row.movement_type === "out") return "出庫";
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
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileContentHash, setFileContentHash] = useState<string | null>(null);
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
    setFileContent(null);
    setFileContentHash(null);
    setParseErrors([]);
    setRows([]);
    setValidation(null);
    setApplyResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const runValidation = useCallback(
    async (
      targetRows: KeyenceImportRow[],
      hash: string,
      alreadyImported: boolean
    ) => {
      const result = await validateKeyenceRows(targetRows, {
        fileContentHash: hash,
        alreadyImported,
      });
      setValidation(result);
      setRows(result.rows);
      setStep("preview");
      if (alreadyImported) {
        setStatusMessage(KEYENCE_DUPLICATE_FILE_MESSAGE);
        setError(KEYENCE_DUPLICATE_FILE_MESSAGE);
      } else {
        setStatusMessage(
          `解析完了: ${result.rows.length} 件（有効 ${result.validCount} / 未登録 ${result.unregisteredCount} / 棚卸スキップ ${result.mode3Count} / エラー ${result.errorCount} / 警告 ${result.warningCount}）`
        );
      }
      return result;
    },
    []
  );

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
      const hash = await hashKeyenceFileContent(parsed.rawText);
      const alreadyImported = await isKeyenceFileAlreadyImported(hash);

      setFileName(parsed.fileName);
      setFileContent(parsed.rawText);
      setFileContentHash(hash);
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
      await runValidation(parsed.rows, hash, alreadyImported);
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
    input: Pick<
      KeyenceImportRow,
      | "part_number"
      | "product_name"
      | "shelf_code"
      | "movement_type"
      | "quantity"
      | "memo"
    >
  ) => {
    const manualRow = createManualKeyenceRow(input);
    const nextRows = [...rows, manualRow];
    setShowManual(false);
    setFileName(fileName ?? "手動入力");
    const hash = fileContentHash ?? (await hashKeyenceFileContent(`manual:${Date.now()}`));
    if (!fileContentHash) {
      setFileContentHash(hash);
    }
    await runValidation(nextRows, hash, validation?.alreadyImported ?? false);
  };

  const handleConfirmApply = async () => {
    if (!validation) return;

    if (validation.alreadyImported) {
      setError(KEYENCE_DUPLICATE_FILE_MESSAGE);
      return;
    }

    if (!fileContent || !fileContentHash || !fileName) {
      setError("取込対象のファイルがありません。先にファイルを取り込んでください。");
      return;
    }

    if (validation.validCount === 0 && validation.mode3Count === 0) {
      const proceed = window.confirm(
        "在庫反映できる行がありません。未登録の保存と監査ログのみ行います。よろしいですか？"
      );
      if (!proceed) return;
    } else if (validation.unregisteredCount > 0 || validation.mode3Count > 0) {
      const proceed = window.confirm(
        `有効 ${validation.validCount} 件を在庫へ反映します。\n未登録 ${validation.unregisteredCount} 件 / 棚卸スキップ ${validation.mode3Count} 件は在庫変更しません。\nよろしいですか？`
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

      const result = await applyKeyenceImport({
        fileName,
        fileContent,
        fileContentHash,
      });

      if (result.rejectedDuplicate) {
        setApplyResult(result);
        setStep("preview");
        setError(KEYENCE_DUPLICATE_FILE_MESSAGE);
        setStatusMessage(KEYENCE_DUPLICATE_FILE_MESSAGE);
        return;
      }

      // プレビュー上の手動入力行（ファイル外）は個別に入出庫APIへ
      const errorRowIds = new Set(
        validation.issues
          .filter((i) => i.level === "error")
          .map((i) => i.rowId)
      );
      for (const row of rows) {
        if (row.source !== "manual") continue;
        if (errorRowIds.has(row.id)) continue;
        if (row.mode !== 1 && row.mode !== 2) continue;
        if (!row.part_number || !row.movement_type || row.quantity == null) {
          continue;
        }
        try {
          const res = await fetch("/api/inventory/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              partNumber: row.part_number,
              transactionType: row.movement_type,
              quantity: row.quantity,
              staffCode: row.staff_code || null,
              comment: row.memo || "KEYENCE手動入力",
            }),
          });
          const json = (await res.json()) as { error?: string };
          if (!res.ok) {
            result.failed += 1;
            result.errors.push(
              `手動:${row.part_number}: ${json.error ?? "失敗"}`
            );
          } else {
            result.success += 1;
          }
        } catch (manualErr) {
          result.failed += 1;
          result.errors.push(
            `手動:${row.part_number}: ${
              manualErr instanceof Error ? manualErr.message : "失敗"
            }`
          );
        }
      }

      setApplyResult(result);
      setStep("done");
      setStatusMessage(
        `反映完了: 成功 ${result.success} / 未登録 ${result.unregistered} / 棚卸スキップ ${result.mode3Skipped} / エラー ${result.failed}`
      );
    } catch (err) {
      setError(formatSupabaseError(err));
      setStep("preview");
      setStatusMessage("反映に失敗しました。");
    }
  };

  const issues = validation?.issues ?? [];
  const confirmDisabled =
    !validation ||
    validation.alreadyImported ||
    (!fileContent && validation.validCount === 0);

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
              disabled={confirmDisabled}
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
                  const hasWarning = rowIssues.some(
                    (i) => i.level === "warning" || i.level === "info"
                  );

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
                      <td>{row.shelf_code}</td>
                      <td>{movementLabel(row)}</td>
                      <td className="text-right">{row.quantity ?? "-"}</td>
                      <td>
                        {row.staff_code
                          ? `担当:${row.staff_code}`
                          : row.memo}
                      </td>
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
              成功: {applyResult.success} 件 / 未登録: {applyResult.unregistered}{" "}
              件 / 棚卸スキップ: {applyResult.mode3Skipped} 件 / エラー:{" "}
              {applyResult.failed} 件
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
          ※ INOUT_LOG（mode1入庫 / mode2出庫）を取り込みます。mode3（棚卸）は対象外です。
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
