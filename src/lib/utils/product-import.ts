import { createProduct, fetchProducts, updateProduct } from "@/lib/supabase/client";
import { getCsvColumnIndex, parseCsv } from "@/lib/utils/csv";
import type { ProductFormData } from "@/lib/types/product";

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

function parseNumber(value: string, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function rowToFormData(row: string[], headers: string[]): ProductFormData | null {
  const partIndex = getCsvColumnIndex(headers, ["part_number", "品番"]);
  const nameIndex = getCsvColumnIndex(headers, ["product_name", "品名"]);

  if (partIndex < 0 || nameIndex < 0) {
    return null;
  }

  const partNumber = row[partIndex]?.trim() ?? "";
  const productName = row[nameIndex]?.trim() ?? "";

  if (!partNumber || !productName) {
    return null;
  }

  const get = (candidates: string[], fallback = "") => {
    const index = getCsvColumnIndex(headers, candidates);
    return index >= 0 ? (row[index]?.trim() ?? fallback) : fallback;
  };

  return {
    shelf_number: get(["shelf_number", "棚番"]),
    supplier: get(["supplier", "仕入先"]),
    department: get(["department", "部門"]),
    part_number: partNumber,
    product_name: productName,
    quantity: parseNumber(get(["quantity", "在庫数", "数量"])),
    unit_price: parseNumber(get(["unit_price", "単価"])),
    reorder_point: parseNumber(get(["reorder_point", "発注点"])),
    memo: get(["memo", "備考"]),
    last_inventory_count: parseNumber(
      get(["last_inventory_count", "最終棚卸数"])
    ),
  };
}

/** CSV から製品を一括取込（品番で新規/更新） */
export async function importProductsFromCsv(text: string): Promise<ImportResult> {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSVにデータ行がありません。");
  }

  const headers = rows[0];
  const existing = await fetchProducts();
  const byPartNumber = new Map(
    existing.map((p) => [p.part_number.toLowerCase(), p])
  );

  const result: ImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const formData = rowToFormData(row, headers);

    if (!formData) {
      result.skipped += 1;
      result.errors.push(`${i + 1}行目: 品番または品名が空のためスキップ`);
      continue;
    }

    try {
      const found = byPartNumber.get(formData.part_number.toLowerCase());
      if (found) {
        await updateProduct(found.id, formData);
        result.updated += 1;
      } else {
        await createProduct(formData);
        result.created += 1;
      }
    } catch (err) {
      result.skipped += 1;
      const message = err instanceof Error ? err.message : "不明なエラー";
      result.errors.push(`${i + 1}行目: ${message}`);
    }
  }

  return result;
}

/** 空のインポートテンプレート行 */
export function getProductImportTemplateRows(): string[][] {
  return [
    [
      "shelf_number",
      "supplier",
      "department",
      "part_number",
      "product_name",
      "quantity",
      "unit_price",
      "reorder_point",
      "memo",
      "last_inventory_count",
    ],
    [
      "A-01",
      "キーエンス",
      "製造",
      "PN-001",
      "センサーケーブル",
      "50",
      "1200",
      "10",
      "",
      "0",
    ],
  ];
}
