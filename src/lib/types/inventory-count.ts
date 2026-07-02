/**
 * 棚卸の型定義
 */

export type InventoryCountStatus = "in_progress" | "completed";

export type InventoryCount = {
  id: string;
  count_date: string;
  title: string;
  status: InventoryCountStatus;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type InventoryCountLine = {
  id: string;
  inventory_count_id: string;
  product_id: string | null;
  part_number: string;
  product_name: string;
  shelf_number: string;
  book_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type InventoryCountWithLines = InventoryCount & {
  lines: InventoryCountLine[];
};

export type InventoryCountFilter = {
  title: string;
  status: "" | InventoryCountStatus;
  dateFrom: string;
  dateTo: string;
};

export const emptyInventoryCountFilter: InventoryCountFilter = {
  title: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};
