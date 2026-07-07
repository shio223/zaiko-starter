/**
 * KEYENCE（BT-600）取り込みの型定義
 * 実機のファイル形式確定後も parser を差し替え可能
 */

export type KeyenceMovementType = "in" | "out";

export type KeyenceRawRow = {
  lineNumber: number;
  raw: string[];
};

export type KeyenceImportRow = {
  id: string;
  lineNumber: number;
  part_number: string;
  product_name: string;
  shelf_number: string;
  movement_type: KeyenceMovementType | null;
  quantity: number | null;
  memo: string;
  source: "file" | "manual";
};

export type KeyenceRowIssue = {
  rowId: string;
  lineNumber: number;
  level: "error" | "warning";
  message: string;
};

export type KeyenceParseResult = {
  fileName: string;
  fileType: "csv" | "txt" | "unknown";
  rows: KeyenceImportRow[];
  parseErrors: string[];
};

export type KeyenceValidationResult = {
  rows: KeyenceImportRow[];
  issues: KeyenceRowIssue[];
  duplicateGroups: string[][];
  validCount: number;
  errorCount: number;
  warningCount: number;
};

export type KeyenceApplyResult = {
  success: number;
  failed: number;
  errors: string[];
};

export type KeyenceImportStep =
  | "ready"
  | "parsing"
  | "preview"
  | "applying"
  | "done";
