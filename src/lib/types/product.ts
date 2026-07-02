/**
 * 製品（在庫）データの型定義
 * Supabase の products テーブルと対応
 */

/** Supabase products テーブルの1行分 */
export type Product = {
  id: string;
  shelf_number: string; // 棚番
  supplier: string; // 仕入先
  department: string; // 部門
  part_number: string; // 品番
  product_name: string; // 品名
  quantity: number; // 在庫数
  unit_price: number; // 単価
  stock_amount: number; // 在庫金額（DBで自動計算）
  reorder_point: number; // 発注点
  memo: string; // 備考
  last_inventory_count: number; // 最終棚卸数
  created_at: string;
  updated_at: string;
};

/** 新規登録・編集フォーム用（id や自動計算項目を除く） */
export type ProductFormData = {
  shelf_number: string;
  supplier: string;
  department: string;
  part_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  reorder_point: number;
  memo: string;
  last_inventory_count: number;
};

/** 在庫リスト・マスタ一覧の検索条件 */
export type SearchFilter = {
  partNumber: string; // 品番
  productName: string; // 品名
  shelfNumber: string; // 棚番
  supplier: string; // 仕入先
  mode: "AND" | "OR"; // 条件の組み合わせ
};

/** 新規登録フォームの初期値 */
export const emptyProductForm: ProductFormData = {
  shelf_number: "",
  supplier: "",
  department: "",
  part_number: "",
  product_name: "",
  quantity: 0,
  unit_price: 0,
  reorder_point: 0,
  memo: "",
  last_inventory_count: 0,
};
