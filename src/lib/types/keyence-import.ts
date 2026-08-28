/**
 * KEYENCE（BT-600）取り込みの型定義
 * 実ログ: 日付,時刻,端末ID,モード,担当者,棚番,品番,数量,,
 */

/** ログ mode: 1=入庫 2=出庫 3=棚卸（今回は在庫反映しない） */
export type KeyenceLogMode = 1 | 2 | 3;

export type KeyenceMovementType = "in" | "out";

export type KeyenceImportRow = {
  id: string;
  lineNumber: number;
  /** Asia/Tokyo のスキャン日時（ISO） */
  scanned_at: string | null;
  device_id: string;
  mode: KeyenceLogMode | null;
  staff_code: string;
  shelf_code: string;
  /** 品番（TEXT。先頭ゼロ保持） */
  part_number: string;
  product_name: string;
  movement_type: KeyenceMovementType | null;
  quantity: number | null;
  memo: string;
  source: "file" | "manual";
};

export type KeyenceRowIssue = {
  rowId: string;
  lineNumber: number;
  level: "error" | "warning" | "info";
  message: string;
};

export type KeyenceParseResult = {
  fileName: string;
  fileType: "csv" | "txt" | "unknown";
  logKind: "inout" | "inventory" | "mixed" | "manual" | "unknown";
  rows: KeyenceImportRow[];
  parseErrors: string[];
  rawText: string;
};

export type KeyenceValidationResult = {
  rows: KeyenceImportRow[];
  issues: KeyenceRowIssue[];
  duplicateGroups: string[][];
  validCount: number;
  errorCount: number;
  warningCount: number;
  mode3Count: number;
  unregisteredCount: number;
  alreadyImported: boolean;
  fileContentHash: string;
};

export type KeyenceApplyResult = {
  success: number;
  unregistered: number;
  mode3Skipped: number;
  failed: number;
  skippedOther: number;
  errors: string[];
  importLogId?: string;
  rejectedDuplicate?: boolean;
};

export type KeyenceImportStep =
  | "ready"
  | "parsing"
  | "preview"
  | "applying"
  | "done";

export const KEYENCE_MODE3_MESSAGE =
  "棚卸データは現在このシステムでは取込対象外です";

export const KEYENCE_DUPLICATE_FILE_MESSAGE =
  "このファイルは既に取り込み済みです";
