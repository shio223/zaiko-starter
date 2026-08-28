/**
 * 製品（在庫）データの型定義
 * Supabase products テーブル = 旧Access T_PRODUCTS
 */

/** Supabase products テーブルの1行分 */
export type Product = {
  id: string;
  shelf_code: string; // T_FIELD1 棚番
  supplier: string; // T_FIELD2 仕入先
  department: string; // T_FIELD3 部門
  part_number: string; // T_FIELD4 品番
  name: string; // T_FIELD5 品名
  quantity: number; // T_FIELD6 現在庫
  unit_price: number; // T_FIELD7 単価
  stock_amount: number; // 在庫金額（DBで自動計算・Web表示用）
  reorder_point: number; // T_FIELD8 発注点
  note: string; // T_FIELD9 備考
  latest_inventory_count: number; // LATEST_INVENTORY_DATA
  print_count: number; // T_PRINT_COUNT
  created_at: string;
  updated_at: string;
};

/** 新規登録・編集フォーム用 */
export type ProductFormData = {
  shelf_code: string;
  supplier: string;
  department: string;
  part_number: string;
  name: string;
  quantity: number;
  unit_price: number;
  reorder_point: number;
  note: string;
  latest_inventory_count: number;
};

/** 在庫リスト・マスタ一覧の検索条件 */
export type SearchFilter = {
  partNumber: string;
  productName: string;
  shelfNumber: string;
  supplier: string;
  department: string;
  mode: "AND" | "OR";
};

/** 新規登録フォームの初期値 */
export const emptyProductForm: ProductFormData = {
  shelf_code: "",
  supplier: "",
  department: "",
  part_number: "",
  name: "",
  quantity: 0,
  unit_price: 0,
  reorder_point: 0,
  note: "",
  latest_inventory_count: 0,
};

/** 旧Access Nz(T_FIELD6,0) < Nz(T_FIELD8,0) 相当 */
export function isBelowReorderPoint(product: Product): boolean {
  return (product.quantity ?? 0) < (product.reorder_point ?? 0);
}
