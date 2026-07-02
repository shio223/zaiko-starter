import type { Product } from "@/lib/types/product";
import { downloadCsv } from "@/lib/utils/csv";

const PRODUCT_EXPORT_HEADERS = [
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
];

/** 在庫リストを CSV 出力 */
export function exportProductsToCsv(products: Product[], filename?: string): void {
  const rows = [
    PRODUCT_EXPORT_HEADERS,
    ...products.map((p) => [
      p.shelf_number,
      p.supplier,
      p.department,
      p.part_number,
      p.product_name,
      p.quantity,
      p.unit_price,
      p.reorder_point,
      p.memo,
      p.last_inventory_count,
    ]),
  ];

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(filename ?? `inventory_${date}.csv`, rows);
}

/** KEYENCE ハンディ向けマスタ出力 */
export function exportKeyenceMasterCsv(products: Product[]): void {
  const rows = [
    ["part_number", "product_name", "shelf_number", "quantity"],
    ...products.map((p) => [
      p.part_number,
      p.product_name,
      p.shelf_number,
      p.quantity,
    ]),
  ];
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`keyence_master_${date}.csv`, rows);
}

/** KEYENCE スキャン結果テンプレート */
export function downloadKeyenceResultTemplate(): void {
  downloadCsv("keyence_result_template.csv", [
    ["part_number", "movement_type", "quantity", "memo"],
    ["PN-001", "in", 10, "入庫例"],
    ["PN-002", "out", 5, "出庫例"],
  ]);
}
