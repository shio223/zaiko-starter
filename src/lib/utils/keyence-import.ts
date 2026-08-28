import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchProducts } from "@/lib/supabase/client";
import { HANDHELD_IMPORT_LOGS_TABLE } from "@/lib/supabase/handheld-import-schema";
import {
  KEYENCE_DUPLICATE_FILE_MESSAGE,
  KEYENCE_MODE3_MESSAGE,
  type KeyenceApplyResult,
  type KeyenceImportRow,
  type KeyenceRowIssue,
  type KeyenceValidationResult,
} from "@/lib/types/keyence-import";
import { sha256Hex } from "@/lib/utils/sha256";

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error("Supabase is not configured");
    }
    supabaseInstance = createClient(url, anon);
  }
  return supabaseInstance;
}

function rowContentKey(row: KeyenceImportRow): string {
  return [
    row.part_number,
    row.mode ?? "",
    row.quantity ?? "",
    row.scanned_at ?? "",
    row.staff_code,
  ].join("|");
}

/** ファイル内容ハッシュ */
export async function hashKeyenceFileContent(rawText: string): Promise<string> {
  return sha256Hex(rawText);
}

/** 同一内容が既に取込済みか（014 適用後） */
export async function isKeyenceFileAlreadyImported(
  fileContentHash: string
): Promise<boolean> {
  const { data, error } = await getSupabaseClient()
    .from(HANDHELD_IMPORT_LOGS_TABLE)
    .select("id")
    .eq("file_content_hash", fileContentHash)
    .limit(1);

  if (error) {
    // テーブル未作成時はプレビュー継続（適用時にサーバーで再判定）
    if (
      error.message.includes("does not exist") ||
      error.code === "42P01" ||
      error.code === "PGRST205"
    ) {
      return false;
    }
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

/** 取り込みデータの検証（プレビュー用・在庫は変更しない） */
export async function validateKeyenceRows(
  rows: KeyenceImportRow[],
  options: {
    fileContentHash: string;
    alreadyImported?: boolean;
  }
): Promise<KeyenceValidationResult> {
  const products = await fetchProducts();
  const byPartNumber = new Map(
    products.map((p) => [p.part_number, p])
  );

  const issues: KeyenceRowIssue[] = [];
  const keyToIds = new Map<string, string[]>();
  let mode3Count = 0;
  let unregisteredCount = 0;

  const alreadyImported = options.alreadyImported ?? false;
  if (alreadyImported) {
    issues.push({
      rowId: "__file__",
      lineNumber: 0,
      level: "error",
      message: KEYENCE_DUPLICATE_FILE_MESSAGE,
    });
  }

  for (const row of rows) {
    if (row.mode === 3) {
      mode3Count += 1;
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "info",
        message: KEYENCE_MODE3_MESSAGE,
      });
      continue;
    }

    if (row.mode !== 1 && row.mode !== 2) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "モードが不正です（1=入庫 / 2=出庫）。",
      });
    }

    if (!row.part_number) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "品番が空です。",
      });
    }

    if (!row.movement_type) {
      if (row.mode === 1 || row.mode === 2) {
        issues.push({
          rowId: row.id,
          lineNumber: row.lineNumber,
          level: "error",
          message: "入出庫区分が不正です。",
        });
      }
    }

    if (row.quantity === null || row.quantity <= 0) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "数量が不正です。",
      });
    }

    if (!row.scanned_at && row.source === "file") {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "warning",
        message: "日時を解釈できませんでした（反映時はサーバー時刻になります）。",
      });
    }

    const product = row.part_number
      ? byPartNumber.get(row.part_number)
      : undefined;

    if (row.part_number && !product) {
      unregisteredCount += 1;
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "未登録",
      });
    } else if (product) {
      if (!row.product_name) {
        row.product_name = product.name;
      }
      if (!row.shelf_code) {
        row.shelf_code = product.shelf_code;
      }

      if (
        row.movement_type === "out" &&
        row.quantity !== null &&
        product.quantity < row.quantity
      ) {
        issues.push({
          rowId: row.id,
          lineNumber: row.lineNumber,
          level: "warning",
          message: `出庫後に在庫がマイナスになります（現在庫: ${product.quantity}）。`,
        });
      }
    }

    const key = rowContentKey(row);
    const ids = keyToIds.get(key) ?? [];
    ids.push(row.id);
    keyToIds.set(key, ids);
  }

  const duplicateGroups = [...keyToIds.values()].filter((ids) => ids.length > 1);
  for (const group of duplicateGroups) {
    for (const rowId of group) {
      const row = rows.find((r) => r.id === rowId);
      if (!row || row.mode === 3) continue;
      issues.push({
        rowId,
        lineNumber: row.lineNumber,
        level: "warning",
        message: "同一内容の重複行があります。",
      });
    }
  }

  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;
  const errorRowIds = new Set(
    issues.filter((i) => i.level === "error").map((i) => i.rowId)
  );

  // mode3 は error ではないが適用対象外。valid = 入出庫でエラーなし
  const validCount = rows.filter(
    (r) =>
      (r.mode === 1 || r.mode === 2) &&
      !errorRowIds.has(r.id) &&
      r.part_number &&
      r.movement_type &&
      r.quantity !== null
  ).length;

  return {
    rows,
    issues,
    duplicateGroups,
    validCount,
    errorCount,
    warningCount,
    mode3Count,
    unregisteredCount,
    alreadyImported,
    fileContentHash: options.fileContentHash,
  };
}

/** 確定反映（API Route → service_role） */
export async function applyKeyenceImport(input: {
  fileName: string;
  fileContent: string;
  fileContentHash: string;
}): Promise<KeyenceApplyResult> {
  const res = await fetch("/api/keyence/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });

  const json = (await res.json()) as KeyenceApplyResult & { error?: string };

  if (res.status === 409) {
    return {
      success: 0,
      unregistered: 0,
      mode3Skipped: 0,
      failed: 0,
      skippedOther: 0,
      errors: [json.error ?? KEYENCE_DUPLICATE_FILE_MESSAGE],
      rejectedDuplicate: true,
    };
  }

  if (!res.ok) {
    throw new Error(json.error ?? "KEYENCE取込に失敗しました。");
  }

  return {
    success: json.success ?? 0,
    unregistered: json.unregistered ?? 0,
    mode3Skipped: json.mode3Skipped ?? 0,
    failed: json.failed ?? 0,
    skippedOther: json.skippedOther ?? 0,
    errors: json.errors ?? [],
    importLogId: json.importLogId,
    rejectedDuplicate: false,
  };
}

export function createManualKeyenceRow(
  input: Omit<
    KeyenceImportRow,
    "id" | "lineNumber" | "source" | "mode" | "device_id" | "scanned_at" | "staff_code"
  > & {
    staff_code?: string;
  }
): KeyenceImportRow {
  const movement_type = input.movement_type;
  const mode = movement_type === "in" ? 1 : movement_type === "out" ? 2 : null;
  return {
    ...input,
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    lineNumber: 0,
    source: "manual",
    mode,
    device_id: "",
    scanned_at: null,
    staff_code: input.staff_code ?? "",
    shelf_code: input.shelf_code ?? "",
  };
}
