export const INVENTORY_COUNTS_TABLE = "inventory_counts";
export const INVENTORY_COUNT_LINES_TABLE = "inventory_count_lines";

export const INVENTORY_COUNTS_SELECT =
  "id, count_date, title, status, memo, created_at, updated_at";

export const INVENTORY_COUNT_LINES_SELECT =
  "id, inventory_count_id, product_id, part_number, product_name, shelf_number, book_quantity, counted_quantity, variance, memo, created_at, updated_at";
