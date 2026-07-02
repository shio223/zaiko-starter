/**
 * 既存 Supabase プロジェクト「Zaiko STARTER」の products テーブル定義
 * Web版が参照するテーブル名・カラム一覧
 */

/** テーブル名 */
export const PRODUCTS_TABLE = "products" as const;

/** 全カラム名（型チェック用） */
export const PRODUCTS_COLUMNS = [
  "id", // 主キー（UUID）
  "shelf_number", // 棚番
  "supplier", // 仕入先
  "department", // 部門
  "part_number", // 品番
  "product_name", // 品名
  "quantity", // 在庫数
  "unit_price", // 単価
  "stock_amount", // 在庫金額
  "reorder_point", // 発注点
  "memo", // 備考
  "last_inventory_count", // 最終棚卸数
  "created_at", // 作成日時
  "updated_at", // 更新日時
] as const;

export type ProductsColumn = (typeof PRODUCTS_COLUMNS)[number];

/** Supabase クエリ用の SELECT 文字列 */
export const PRODUCTS_SELECT =
  "id,shelf_number,supplier,department,part_number,product_name,quantity,unit_price,stock_amount,reorder_point,memo,last_inventory_count,created_at,updated_at" as const;
