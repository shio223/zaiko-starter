/**
 * 未登録品番（unregistered_entries = 旧Access T_NOT_ENTRY 相当）
 */

export type UnregisteredEntryMode = 1 | 2 | 3;

export type UnregisteredEntryStatus = "open" | "resolved";

export type UnregisteredEntry = {
  id: string;
  import_log_id: string | null;
  scanned_at: string | null;
  device_id: string;
  mode: UnregisteredEntryMode;
  staff_code: string | null;
  shelf_code: string;
  part_number: string;
  quantity: number | null;
  status: UnregisteredEntryStatus;
  note: string;
  created_at: string;
  updated_at: string;
};

export type UnregisteredEntryFilter = {
  partNumber: string;
  shelfCode: string;
  mode: "" | "1" | "2" | "3";
  dateFrom: string;
  dateTo: string;
  status: "" | UnregisteredEntryStatus;
};

export type UnregisteredEntriesPage = {
  rows: UnregisteredEntry[];
  total: number;
  page: number;
  pageSize: number;
};

export const emptyUnregisteredEntryFilter: UnregisteredEntryFilter = {
  partNumber: "",
  shelfCode: "",
  mode: "",
  dateFrom: "",
  dateTo: "",
  status: "",
};

export function getUnregisteredModeLabel(mode: UnregisteredEntryMode): string {
  if (mode === 1) return "入庫";
  if (mode === 2) return "出庫";
  if (mode === 3) return "棚卸";
  return String(mode);
}

export function getUnregisteredStatusLabel(
  status: UnregisteredEntryStatus
): string {
  if (status === "open") return "未解消";
  if (status === "resolved") return "解消済み";
  return status;
}
