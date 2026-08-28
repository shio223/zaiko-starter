/**
 * products テーブル定義（旧Access T_PRODUCTS 準拠）
 */

export const PRODUCTS_TABLE = "products" as const;

export const PRODUCTS_COLUMNS = [
  "id",
  "shelf_code",
  "supplier",
  "department",
  "part_number",
  "name",
  "quantity",
  "unit_price",
  "stock_amount",
  "reorder_point",
  "note",
  "latest_inventory_count",
  "print_count",
  "created_at",
  "updated_at",
] as const;

export type ProductsColumn = (typeof PRODUCTS_COLUMNS)[number];

export const PRODUCTS_SELECT =
  "id,shelf_code,supplier,department,part_number,name,quantity,unit_price,stock_amount,reorder_point,note,latest_inventory_count,print_count,created_at,updated_at" as const;

/** CSV / MDB インポート用カラム（id, stock_amount, timestamps を除く） */
export const PRODUCTS_IMPORT_COLUMNS = [
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
] as const;
