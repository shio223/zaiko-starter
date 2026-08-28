/**
 * inventory_transactions テーブル操作（読取専用・Supabase 側フィルタ＋ページング）
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  INVENTORY_TRANSACTIONS_SELECT,
  INVENTORY_TRANSACTIONS_TABLE,
} from "@/lib/supabase/inventory-transactions-schema";
import type {
  InventoryTransaction,
  InventoryTransactionFilter,
  InventoryTransactionsPage,
} from "@/lib/types/inventory-transaction";

const DEFAULT_PAGE_SIZE = 50;

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase is not configured");
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function buildFilteredQuery(filter: InventoryTransactionFilter) {
  let query = getSupabaseClient()
    .from(INVENTORY_TRANSACTIONS_TABLE)
    .select(INVENTORY_TRANSACTIONS_SELECT, { count: "exact" })
    .order("transaction_at", { ascending: false });

  const partNumber = filter.partNumber.trim();
  if (partNumber) {
    query = query.ilike("part_number", `%${escapeIlikePattern(partNumber)}%`);
  }

  const shelfCode = filter.shelfCode.trim();
  if (shelfCode) {
    query = query.ilike("shelf_code", `%${escapeIlikePattern(shelfCode)}%`);
  }

  if (filter.transactionType) {
    query = query.eq("transaction_type", filter.transactionType);
  }

  if (filter.dateFrom) {
    query = query.gte("transaction_at", `${filter.dateFrom}T00:00:00`);
  }

  if (filter.dateTo) {
    query = query.lte("transaction_at", `${filter.dateTo}T23:59:59.999`);
  }

  return query;
}

export async function fetchInventoryTransactionsPage(input: {
  filter: InventoryTransactionFilter;
  page?: number;
  pageSize?: number;
}): Promise<InventoryTransactionsPage> {
  const page = input.page ?? 0;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await buildFilteredQuery(input.filter).range(
    from,
    to
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    rows: (data ?? []) as unknown as InventoryTransaction[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

/** CSV 出力用：条件一致の全件を Supabase 側でページング取得 */
export async function fetchAllInventoryTransactions(
  filter: InventoryTransactionFilter
): Promise<InventoryTransaction[]> {
  const pageSize = 1000;
  let page = 0;
  const all: InventoryTransaction[] = [];

  while (true) {
    const result = await fetchInventoryTransactionsPage({
      filter,
      page,
      pageSize,
    });
    all.push(...result.rows);
    if (all.length >= result.total || result.rows.length < pageSize) {
      break;
    }
    page += 1;
  }

  return all;
}

export const inventoryTransactionsPageSize = DEFAULT_PAGE_SIZE;
