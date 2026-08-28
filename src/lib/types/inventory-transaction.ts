/**
 * inventory_transactions テーブル（旧Access T_IN_OUT）
 */
export type InventoryTransaction = {
  id: string;
  product_id: string | null;
  shelf_code: string;
  part_number: string;
  staff_code: string | null;
  transaction_at: string;
  previous_stock: number;
  inbound_qty: number;
  outbound_qty: number;
  current_stock: number;
  automatic_adjustment: number;
  manual_value: number | null;
  location: string;
  comment: string;
  transaction_type: "in" | "out" | "adjust";
  created_at: string;
};

export type InventoryTransactionFilter = {
  partNumber: string;
  shelfCode: string;
  transactionType: "" | "in" | "out" | "adjust";
  dateFrom: string;
  dateTo: string;
};

export const emptyInventoryTransactionFilter: InventoryTransactionFilter = {
  partNumber: "",
  shelfCode: "",
  transactionType: "",
  dateFrom: "",
  dateTo: "",
};

export type InventoryTransactionsPage = {
  rows: InventoryTransaction[];
  total: number;
  page: number;
  pageSize: number;
};
