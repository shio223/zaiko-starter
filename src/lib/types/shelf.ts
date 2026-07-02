/**
 * 棚番マスタの型定義
 * Supabase の shelves テーブルと対応
 */

export type Shelf = {
  id: string;
  shelf_number: string; // 棚番
  shelf_name: string; // 棚名
  location: string; // 保管場所
  memo: string; // 備考
  created_at: string;
  updated_at: string;
};

export type ShelfFormData = {
  shelf_number: string;
  shelf_name: string;
  location: string;
  memo: string;
};

export type ShelfSearchFilter = {
  shelfNumber: string;
  shelfName: string;
  location: string;
  mode: "AND" | "OR";
};

export const emptyShelfForm: ShelfFormData = {
  shelf_number: "",
  shelf_name: "",
  location: "",
  memo: "",
};
