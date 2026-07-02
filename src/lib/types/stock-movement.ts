/**
 * 入出庫履歴の型定義
 */

export type MovementType = "in" | "out" | "adjust";

export type StockMovement = {
  id: string;
  product_id: string | null;
  movement_type: MovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  part_number: string;
  product_name: string;
  shelf_number: string;
  memo: string;
  performed_at: string;
  created_at: string;
};

export type StockMovementFilter = {
  partNumber: string;
  productName: string;
  movementType: "" | MovementType;
  dateFrom: string;
  dateTo: string;
};

export const emptyStockMovementFilter: StockMovementFilter = {
  partNumber: "",
  productName: "",
  movementType: "",
  dateFrom: "",
  dateTo: "",
};

export type StockInOutForm = {
  quantity: number;
  memo: string;
};
