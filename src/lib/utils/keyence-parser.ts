/**
 * KEYENCE BT-600 実ログパーサー
 *
 * 形式: 日付,時刻,端末ID,モード,担当者,棚番,品番,数量,,
 * 列0=日付 列1=時刻 列2=端末ID 列3=モード 列4=担当者
 * 列5=棚番 列6=品番 列7=数量
 *
 * 品番は TEXT のまま（先頭ゼロを消さない）
 * 日付+時刻は Asia/Tokyo として扱う
 */
import type {
  KeyenceImportRow,
  KeyenceLogMode,
  KeyenceMovementType,
  KeyenceParseResult,
} from "@/lib/types/keyence-import";

function detectFileType(fileName: string): "csv" | "txt" | "unknown" {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".txt")) return "txt";
  return "unknown";
}

function detectLogKind(
  fileName: string,
  modes: Array<KeyenceLogMode | null>
): KeyenceParseResult["logKind"] {
  const upper = fileName.toUpperCase();
  if (upper.includes("INVENTORY_LOG")) return "inventory";
  if (upper.includes("INOUT_LOG")) return "inout";

  const set = new Set(modes.filter((m): m is KeyenceLogMode => m != null));
  if (set.size === 0) return "unknown";
  if (set.size > 1) return "mixed";
  if (set.has(3) && set.size === 1) return "inventory";
  return "inout";
}

function createRowId(lineNumber: number): string {
  return `line-${lineNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 品番: trim のみ。数値化しない（先頭ゼロ保持） */
export function normalizePartNumber(raw: string): string {
  return raw.trim();
}

function parseMode(raw: string): KeyenceLogMode | null {
  const value = raw.trim();
  if (value === "1") return 1;
  if (value === "2") return 2;
  if (value === "3") return 3;
  return null;
}

function modeToMovement(mode: KeyenceLogMode | null): KeyenceMovementType | null {
  if (mode === 1) return "in";
  if (mode === 2) return "out";
  return null;
}

function parseQuantity(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * 日付 + 時刻 → Asia/Tokyo の ISO 文字列
 * 例: 2013/12/22 + 11:45:02 → 2013-12-22T11:45:02+09:00
 */
export function parseTokyoDateTime(
  dateRaw: string,
  timeRaw: string
): string | null {
  const date = dateRaw.trim().replace(/\//g, "-");
  const time = timeRaw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) return null;

  const [hh, mm, ss = "00"] = time.split(":");
  const h = hh.padStart(2, "0");
  const m = mm.padStart(2, "0");
  const s = ss.padStart(2, "0");
  const iso = `${date}T${h}:${m}:${s}+09:00`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return iso;
}

function splitLogLine(line: string): string[] {
  const delimiter = line.includes("\t") && !line.includes(",") ? "\t" : ",";
  return line.split(delimiter).map((c) => c.trim());
}

function parseFixedColumnRow(
  cols: string[],
  lineNumber: number,
  source: "file" | "manual"
): KeyenceImportRow {
  const mode = parseMode(cols[3] ?? "");
  return {
    id: createRowId(lineNumber),
    lineNumber,
    scanned_at: parseTokyoDateTime(cols[0] ?? "", cols[1] ?? ""),
    device_id: (cols[2] ?? "").trim(),
    mode,
    staff_code: (cols[4] ?? "").trim(),
    shelf_code: (cols[5] ?? "").trim(),
    part_number: normalizePartNumber(cols[6] ?? ""),
    product_name: "",
    movement_type: modeToMovement(mode),
    quantity: parseQuantity(cols[7] ?? ""),
    memo: "",
    source,
  };
}

/** 実ログ形式（INOUT_LOG / INVENTORY_LOG）の本文解析 */
export function parseKeyenceLogText(
  text: string,
  fileName: string
): KeyenceParseResult {
  const fileType = detectFileType(fileName);
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);

  const parseErrors: string[] = [];
  if (lines.length === 0) {
    return {
      fileName,
      fileType,
      logKind: "unknown",
      rows: [],
      parseErrors: ["ファイルにデータがありません。"],
      rawText: text,
    };
  }

  const rows: KeyenceImportRow[] = lines.map((line, index) => {
    const cols = splitLogLine(line);
    return parseFixedColumnRow(cols, index + 1, "file");
  });

  const logKind = detectLogKind(
    fileName,
    rows.map((r) => r.mode)
  );

  const invalidMode = rows.filter((r) => r.mode == null).length;
  if (invalidMode > 0) {
    parseErrors.push(
      `モードが不正な行が ${invalidMode} 件あります（1=入庫 / 2=出庫 / 3=棚卸）。`
    );
  }

  return {
    fileName,
    fileType,
    logKind,
    rows,
    parseErrors,
    rawText: text,
  };
}

/** ファイル内容を解析 */
export async function parseKeyenceFile(file: File): Promise<KeyenceParseResult> {
  const text = await file.text();
  return parseKeyenceLogText(text, file.name);
}
