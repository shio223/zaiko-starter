/**
 * 月別移動量（inventory_transactions を Asia/Tokyo 月で集計）
 *
 * 入庫 = SUM(inbound_qty) / 出庫 = SUM(outbound_qty)
 * adjust（automatic_adjustment）は入庫・出庫に含めない。
 * 将来「棚卸調整」列を追加する場合は SUM(automatic_adjustment) を別集計する。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  INVENTORY_TRANSACTIONS_SELECT,
  INVENTORY_TRANSACTIONS_TABLE,
} from "@/lib/supabase/inventory-transactions-schema";
import { PRODUCTS_SELECT, PRODUCTS_TABLE } from "@/lib/supabase/products-schema";
import type {
  MonthlyMovementFilter,
  MonthlyMovementRow,
} from "@/lib/types/monthly-movement";

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

type RpcMonthlyRow = {
  year_month: string;
  part_number: string;
  product_name: string;
  shelf_number: string;
  in_quantity: number | string;
  out_quantity: number | string;
  net_quantity: number | string;
};

function toMonthlyRow(row: RpcMonthlyRow): MonthlyMovementRow {
  return {
    yearMonth: row.year_month,
    part_number: row.part_number,
    product_name: row.product_name ?? "",
    shelf_number: row.shelf_number ?? "",
    in_quantity: Number(row.in_quantity),
    out_quantity: Number(row.out_quantity),
    net_quantity: Number(row.net_quantity),
  };
}

/** Asia/Tokyo の年月文字列 YYYY-MM */
export function toTokyoYearMonth(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 年月の Asia/Tokyo 開始〜翌月開始（UTC ISO） */
function tokyoMonthUtcRange(yearMonth: string): { from: string; toExclusive: string } {
  const [yStr, mStr] = yearMonth.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  // JST 00:00 = UTC 前月 15:00
  const from = new Date(Date.UTC(y, m - 1, 1, -9, 0, 0));
  const toExclusive = new Date(Date.UTC(y, m, 1, -9, 0, 0));
  return { from: from.toISOString(), toExclusive: toExclusive.toISOString() };
}

async function fetchTransactionsForFilter(
  filter: MonthlyMovementFilter
): Promise<
  {
    transaction_at: string;
    part_number: string;
    shelf_code: string;
    inbound_qty: number;
    outbound_qty: number;
  }[]
> {
  const pageSize = 1000;
  let from = 0;
  const all: {
    transaction_at: string;
    part_number: string;
    shelf_code: string;
    inbound_qty: number;
    outbound_qty: number;
  }[] = [];

  while (true) {
    let query = getSupabaseClient()
      .from(INVENTORY_TRANSACTIONS_TABLE)
      .select(
        "transaction_at,part_number,shelf_code,inbound_qty,outbound_qty"
      )
      .order("transaction_at", { ascending: true })
      .range(from, from + pageSize - 1);

    const yearMonth = filter.yearMonth.trim();
    if (yearMonth) {
      const range = tokyoMonthUtcRange(yearMonth);
      query = query
        .gte("transaction_at", range.from)
        .lt("transaction_at", range.toExclusive);
    }

    const partNumber = filter.partNumber.trim();
    if (partNumber) {
      query = query.ilike("part_number", `%${partNumber.replace(/[%_\\]/g, "\\$&")}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as typeof all;
    all.push(...page);
    if (page.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return all;
}

async function fetchProductLookup(
  partNumbers: string[]
): Promise<Map<string, { name: string; shelf_code: string }>> {
  const map = new Map<string, { name: string; shelf_code: string }>();
  const unique = [...new Set(partNumbers.filter(Boolean))];
  if (unique.length === 0) {
    return map;
  }

  // Supabase IN 制限を避けるためチャンク
  const chunkSize = 200;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data, error } = await getSupabaseClient()
      .from(PRODUCTS_TABLE)
      .select("part_number,name,shelf_code")
      .in("part_number", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const p of data ?? []) {
      map.set(p.part_number as string, {
        name: (p.name as string) ?? "",
        shelf_code: (p.shelf_code as string) ?? "",
      });
    }
  }

  return map;
}

function aggregateRows(
  transactions: Awaited<ReturnType<typeof fetchTransactionsForFilter>>,
  products: Map<string, { name: string; shelf_code: string }>,
  productNameFilter: string
): MonthlyMovementRow[] {
  const map = new Map<
    string,
    {
      yearMonth: string;
      part_number: string;
      shelf_from_tx: string;
      in_quantity: number;
      out_quantity: number;
    }
  >();

  for (const t of transactions) {
    const yearMonth = toTokyoYearMonth(t.transaction_at);
    const key = `${yearMonth}|${t.part_number}`;
    const existing = map.get(key) ?? {
      yearMonth,
      part_number: t.part_number,
      shelf_from_tx: t.shelf_code || "",
      in_quantity: 0,
      out_quantity: 0,
    };
    existing.in_quantity += Number(t.inbound_qty);
    existing.out_quantity += Number(t.outbound_qty);
    if (!existing.shelf_from_tx && t.shelf_code) {
      existing.shelf_from_tx = t.shelf_code;
    }
    map.set(key, existing);
  }

  const nameQuery = productNameFilter.trim().toLowerCase();
  const rows: MonthlyMovementRow[] = [];

  for (const item of map.values()) {
    const product = products.get(item.part_number);
    const product_name = product?.name ?? "";
    const shelf_number = product?.shelf_code || item.shelf_from_tx || "";

    if (nameQuery && !product_name.toLowerCase().includes(nameQuery)) {
      continue;
    }

    rows.push({
      yearMonth: item.yearMonth,
      part_number: item.part_number,
      product_name,
      shelf_number,
      in_quantity: item.in_quantity,
      out_quantity: item.out_quantity,
      net_quantity: item.in_quantity - item.out_quantity,
    });
  }

  return rows.sort((a, b) => {
    if (a.yearMonth !== b.yearMonth) {
      return b.yearMonth.localeCompare(a.yearMonth);
    }
    return a.part_number.localeCompare(b.part_number);
  });
}

async function fetchMonthlyMovementsViaAggregation(
  filter: MonthlyMovementFilter
): Promise<MonthlyMovementRow[]> {
  const transactions = await fetchTransactionsForFilter(filter);
  const products = await fetchProductLookup(
    transactions.map((t) => t.part_number)
  );
  return aggregateRows(transactions, products, filter.productName);
}

async function fetchMonthlyMovementsViaRpc(
  filter: MonthlyMovementFilter
): Promise<MonthlyMovementRow[] | null> {
  const { data, error } = await getSupabaseClient().rpc("get_monthly_movements", {
    p_year_month: filter.yearMonth.trim() || null,
    p_part_number: filter.partNumber.trim() || null,
    p_product_name: filter.productName.trim() || null,
  });

  if (error) {
    if (
      error.code === "PGRST202" ||
      error.message.includes("Could not find the function")
    ) {
      return null;
    }
    throw new Error(error.message);
  }

  return ((data ?? []) as RpcMonthlyRow[]).map(toMonthlyRow);
}

/** 年月一覧（新しい順） */
export async function fetchMonthlyMovementMonths(): Promise<string[]> {
  const { data, error } = await getSupabaseClient().rpc(
    "get_monthly_movement_months"
  );

  if (!error) {
    return ((data ?? []) as { year_month: string }[]).map((r) => r.year_month);
  }

  if (
    error.code !== "PGRST202" &&
    !error.message.includes("Could not find the function")
  ) {
    throw new Error(error.message);
  }

  // フォールバック: 取引日時から月を抽出
  const pageSize = 1000;
  let from = 0;
  const months = new Set<string>();

  while (true) {
    const { data, error: qErr } = await getSupabaseClient()
      .from(INVENTORY_TRANSACTIONS_TABLE)
      .select("transaction_at")
      .order("transaction_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (qErr) {
      throw new Error(qErr.message);
    }

    const page = data ?? [];
    for (const row of page) {
      months.add(toTokyoYearMonth(row.transaction_at as string));
    }
    if (page.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return [...months].sort((a, b) => b.localeCompare(a));
}

/** 月別・品番別の入出庫合計 */
export async function fetchMonthlyMovements(
  filter: MonthlyMovementFilter = {
    yearMonth: "",
    partNumber: "",
    productName: "",
  }
): Promise<MonthlyMovementRow[]> {
  const viaRpc = await fetchMonthlyMovementsViaRpc(filter);
  if (viaRpc) {
    return viaRpc;
  }
  return fetchMonthlyMovementsViaAggregation(filter);
}
