/** Supabase shelves テーブル定義 */
export const SHELVES_TABLE = "shelves" as const;

export const SHELVES_SELECT =
  "id,shelf_number,shelf_name,location,memo,created_at,updated_at" as const;
