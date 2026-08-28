import type { Product } from "@/lib/types/product";
import { downloadCsv } from "@/lib/utils/csv";

const PRODUCT_EXPORT_HEADERS = [
  "shelf_code",
  "supplier",
  "department",
  "part_number",
  "name",
  "quantity",
  "unit_price",
  "reorder_point",
  "note",
  "latest_inventory_count",
  "print_count",
];

/** 在庫リストを CSV 出力 */
export function exportProductsToCsv(products: Product[], filename?: string): void {
  const rows = [
    PRODUCT_EXPORT_HEADERS,
    ...products.map((p) => [
      p.shelf_code,
      p.supplier,
      p.department,
      p.part_number,
      p.name,
      p.quantity,
      p.unit_price,
      p.reorder_point,
      p.note,
      p.latest_inventory_count,
      p.print_count,
    ]),
  ];

  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(filename ?? `inventory_${date}.csv`, rows);
}

/** KEYENCE ハンディ向けマスタ出力 */
export function exportKeyenceMasterCsv(products: Product[]): void {
  const rows = [
    ["part_number", "name", "shelf_code", "quantity"],
    ...products.map((p) => [
      p.part_number,
      p.name,
      p.shelf_code,
      p.quantity,
    ]),
  ];
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`keyence_master_${date}.csv`, rows);
}

/** KEYENCE 実ログ形式のサンプル（仮テンプレート） */
export function downloadKeyenceResultTemplate(): void {
  downloadCsv("keyence_inout_log_sample.txt", [
    ["2013/12/22", "11:45:02", "00001", "1", "01", "2624", "00980682", "10", "", ""],
    ["2026/05/22", "10:43:46", "00001", "2", "20", "", "1000106735", "1", "", ""],
    ["2013/12/22", "11:46:06", "00001", "3", "", "2624", "00980682", "10", "", ""],
  ]);
}
