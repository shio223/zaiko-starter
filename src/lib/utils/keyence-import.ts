import { fetchProducts } from "@/lib/supabase/client";
import { performStockMovementByPartNumber } from "@/lib/supabase/stock-movements";
import type {
  KeyenceApplyResult,
  KeyenceImportRow,
  KeyenceRowIssue,
  KeyenceValidationResult,
} from "@/lib/types/keyence-import";

function rowKey(row: KeyenceImportRow): string {
  return [
    row.part_number.toLowerCase(),
    row.movement_type ?? "",
    row.quantity ?? "",
    row.memo,
  ].join("|");
}

/** 取り込みデータの検証・重複チェック */
export async function validateKeyenceRows(
  rows: KeyenceImportRow[]
): Promise<KeyenceValidationResult> {
  const products = await fetchProducts();
  const byPartNumber = new Map(
    products.map((p) => [p.part_number.toLowerCase(), p])
  );

  const issues: KeyenceRowIssue[] = [];
  const keyToIds = new Map<string, string[]>();

  for (const row of rows) {
    if (!row.part_number.trim()) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "品番が空です。",
      });
    }

    if (!row.movement_type) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "入出庫区分が不正です（入庫/出庫）。",
      });
    }

    if (row.quantity === null || row.quantity <= 0) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: "数量が不正です。",
      });
    }

    const product = byPartNumber.get(row.part_number.trim().toLowerCase());
    if (row.part_number.trim() && !product) {
      issues.push({
        rowId: row.id,
        lineNumber: row.lineNumber,
        level: "error",
        message: `品番「${row.part_number}」は製品マスタに未登録です。`,
      });
    } else if (product) {
      if (!row.product_name) {
        row.product_name = product.product_name;
      }
      if (!row.shelf_number) {
        row.shelf_number = product.shelf_number;
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

    const key = rowKey(row);
    const ids = keyToIds.get(key) ?? [];
    ids.push(row.id);
    keyToIds.set(key, ids);
  }

  const duplicateGroups = [...keyToIds.values()].filter((ids) => ids.length > 1);

  for (const group of duplicateGroups) {
    for (const rowId of group) {
      const row = rows.find((r) => r.id === rowId);
      if (!row) continue;
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

  return {
    rows,
    issues,
    duplicateGroups,
    validCount: rows.filter((r) => !errorRowIds.has(r.id)).length,
    errorCount,
    warningCount,
  };
}

/** 確定後に Supabase へ反映 */
export async function applyKeyenceRows(
  rows: KeyenceImportRow[],
  issues: KeyenceRowIssue[]
): Promise<KeyenceApplyResult> {
  const errorRowIds = new Set(
    issues.filter((i) => i.level === "error").map((i) => i.rowId)
  );

  const targets = rows.filter(
    (r) =>
      !errorRowIds.has(r.id) &&
      r.part_number &&
      r.movement_type &&
      r.quantity !== null
  );

  const result: KeyenceApplyResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const row of targets) {
    try {
      await performStockMovementByPartNumber({
        partNumber: row.part_number,
        movementType: row.movement_type!,
        quantity: row.quantity!,
        memo: row.memo || "KEYENCE取込",
      });
      result.success += 1;
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : "不明なエラー";
      result.errors.push(`${row.lineNumber}行目: ${message}`);
    }
  }

  return result;
}

export function createManualKeyenceRow(
  input: Omit<KeyenceImportRow, "id" | "lineNumber" | "source">
): KeyenceImportRow {
  return {
    ...input,
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    lineNumber: 0,
    source: "manual",
  };
}
