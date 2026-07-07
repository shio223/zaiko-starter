import { getCsvColumnIndex, parseCsv } from "@/lib/utils/csv";
import type {
  KeyenceImportRow,
  KeyenceMovementType,
  KeyenceParseResult,
} from "@/lib/types/keyence-import";

function detectFileType(fileName: string): "csv" | "txt" | "unknown" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".txt")) return "txt";
  return "unknown";
}

function parseMovementType(raw: string): KeyenceMovementType | null {
  const value = raw.trim().toLowerCase();
  if (value === "in" || value === "入庫" || value === "入" || value === "1") {
    return "in";
  }
  if (value === "out" || value === "出庫" || value === "出" || value === "2") {
    return "out";
  }
  return null;
}

function parseQuantity(raw: string): number | null {
  const num = Number(raw.trim());
  return Number.isFinite(num) && num > 0 ? num : null;
}

function createRowId(lineNumber: number): string {
  return `line-${lineNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** CSV形式の解析（仮実装・実機形式確定後に拡張） */
function parseCsvContent(text: string, fileName: string): KeyenceParseResult {
  const rows = parseCsv(text);
  const parseErrors: string[] = [];

  if (rows.length === 0) {
    return {
      fileName,
      fileType: "csv",
      rows: [],
      parseErrors: ["ファイルにデータがありません。"],
    };
  }

  const headers = rows[0];
  const partIndex = getCsvColumnIndex(headers, [
    "part_number",
    "品番",
    "barcode",
    "コード",
  ]);
  const nameIndex = getCsvColumnIndex(headers, ["product_name", "品名"]);
  const shelfIndex = getCsvColumnIndex(headers, ["shelf_number", "棚番"]);
  const typeIndex = getCsvColumnIndex(headers, [
    "movement_type",
    "区分",
    "type",
    "入出庫",
  ]);
  const qtyIndex = getCsvColumnIndex(headers, ["quantity", "数量", "qty"]);
  const memoIndex = getCsvColumnIndex(headers, ["memo", "備考"]);

  const hasHeader =
    partIndex >= 0 || typeIndex >= 0 || qtyIndex >= 0 || nameIndex >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const startLine = hasHeader ? 2 : 1;

  if (partIndex < 0 && !hasHeader) {
    parseErrors.push(
      "ヘッダー行が見つかりません。CSV列名（part_number, movement_type, quantity）を確認してください。"
    );
  }

  const parsed: KeyenceImportRow[] = dataRows.map((row, index) => {
    const lineNumber = startLine + index;

    if (!hasHeader) {
      return {
        id: createRowId(lineNumber),
        lineNumber,
        part_number: row[0]?.trim() ?? "",
        product_name: row[1]?.trim() ?? "",
        shelf_number: row[2]?.trim() ?? "",
        movement_type: parseMovementType(row[3] ?? ""),
        quantity: parseQuantity(row[4] ?? ""),
        memo: row[5]?.trim() ?? "",
        source: "file",
      };
    }

    return {
      id: createRowId(lineNumber),
      lineNumber,
      part_number: partIndex >= 0 ? (row[partIndex]?.trim() ?? "") : "",
      product_name: nameIndex >= 0 ? (row[nameIndex]?.trim() ?? "") : "",
      shelf_number: shelfIndex >= 0 ? (row[shelfIndex]?.trim() ?? "") : "",
      movement_type:
        typeIndex >= 0 ? parseMovementType(row[typeIndex] ?? "") : null,
      quantity: qtyIndex >= 0 ? parseQuantity(row[qtyIndex] ?? "") : null,
      memo: memoIndex >= 0 ? (row[memoIndex]?.trim() ?? "") : "",
      source: "file",
    };
  });

  return {
    fileName,
    fileType: "csv",
    rows: parsed.filter(
      (r) =>
        r.part_number ||
        r.product_name ||
        r.movement_type ||
        r.quantity !== null
    ),
    parseErrors,
  };
}

/** TXT形式の解析（タブ or カンマ区切り・仮実装） */
function parseTxtContent(text: string, fileName: string): KeyenceParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const parseErrors: string[] = [];
  if (lines.length === 0) {
    return {
      fileName,
      fileType: "txt",
      rows: [],
      parseErrors: ["ファイルにデータがありません。"],
    };
  }

  const parsed: KeyenceImportRow[] = lines.map((line, index) => {
    const lineNumber = index + 1;
    const delimiter = line.includes("\t") ? "\t" : ",";
    const cols = line.split(delimiter).map((c) => c.trim());

    return {
      id: createRowId(lineNumber),
      lineNumber,
      part_number: cols[0] ?? "",
      product_name: cols[1] ?? "",
      shelf_number: cols[2] ?? "",
      movement_type: parseMovementType(cols[3] ?? ""),
      quantity: parseQuantity(cols[4] ?? ""),
      memo: cols[5] ?? "",
      source: "file",
    };
  });

  parseErrors.push(
    "TXT形式は仮対応です。BT-600の実際の出力形式確認後にパーサーを調整します。"
  );

  return {
    fileName,
    fileType: "txt",
    rows: parsed,
    parseErrors,
  };
}

/** ファイル内容を解析（CSV / TXT 対応） */
export async function parseKeyenceFile(file: File): Promise<KeyenceParseResult> {
  const text = await file.text();
  const fileType = detectFileType(file.name);

  if (fileType === "txt") {
    return parseTxtContent(text, file.name);
  }

  return parseCsvContent(text, file.name);
}
