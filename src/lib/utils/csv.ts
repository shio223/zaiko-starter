/** CSV のダウンロード・パース（データ転送・KEYENCE連携用） */

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** 2次元配列を CSV 文字列に変換 */
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
}

/** CSV ファイルをブラウザからダウンロード */
export function downloadCsv(filename: string, rows: (string | number)[][]): void {
  const bom = "\uFEFF";
  const content = bom + toCsv(rows);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** CSV テキストをパース（簡易版） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** ヘッダー行から列インデックスを取得 */
export function getCsvColumnIndex(
  headers: string[],
  candidates: string[]
): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate.toLowerCase());
    if (index >= 0) {
      return index;
    }
  }
  return -1;
}
