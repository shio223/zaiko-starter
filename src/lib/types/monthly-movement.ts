/**
 * 月別移動量の型定義
 */

export type MonthlyMovementRow = {
  yearMonth: string;
  part_number: string;
  product_name: string;
  shelf_number: string;
  in_quantity: number;
  out_quantity: number;
  net_quantity: number;
};

export type MonthlyMovementFilter = {
  yearMonth: string;
  partNumber: string;
  productName: string;
};

export const emptyMonthlyMovementFilter: MonthlyMovementFilter = {
  yearMonth: "",
  partNumber: "",
  productName: "",
};
