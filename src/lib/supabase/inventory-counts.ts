/**
 * Supabase 棚卸テーブル操作
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  INVENTORY_COUNT_LINES_SELECT,
  INVENTORY_COUNT_LINES_TABLE,
  INVENTORY_COUNTS_SELECT,
  INVENTORY_COUNTS_TABLE,
} from "@/lib/supabase/inventory-counts-schema";
import { fetchProducts } from "@/lib/supabase/client";
import { recordInventoryAdjustment } from "@/lib/supabase/stock-movements";
import type {
  InventoryCount,
  InventoryCountFilter,
  InventoryCountLine,
  InventoryCountWithLines,
} from "@/lib/types/inventory-count";

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

export async function fetchInventoryCounts(): Promise<InventoryCount[]> {
  const { data, error } = await getSupabaseClient()
    .from(INVENTORY_COUNTS_TABLE)
    .select(INVENTORY_COUNTS_SELECT)
    .order("count_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as InventoryCount[];
}

export async function fetchInventoryCountById(
  id: string
): Promise<InventoryCountWithLines | null> {
  const { data: count, error: countError } = await getSupabaseClient()
    .from(INVENTORY_COUNTS_TABLE)
    .select(INVENTORY_COUNTS_SELECT)
    .eq("id", id)
    .single();

  if (countError) {
    if (countError.code === "PGRST116") {
      return null;
    }
    throw new Error(countError.message);
  }

  const { data: lines, error: linesError } = await getSupabaseClient()
    .from(INVENTORY_COUNT_LINES_TABLE)
    .select(INVENTORY_COUNT_LINES_SELECT)
    .eq("inventory_count_id", id)
    .order("part_number", { ascending: true });

  if (linesError) {
    throw new Error(linesError.message);
  }

  return {
    ...(count as InventoryCount),
    lines: (lines ?? []) as unknown as InventoryCountLine[],
  };
}

/** 棚卸開始：全製品を明細として登録 */
export async function createInventoryCount(input: {
  title: string;
  memo?: string;
}): Promise<InventoryCountWithLines> {
  const products = await fetchProducts();
  const today = new Date().toISOString().slice(0, 10);

  const { data: count, error: countError } = await getSupabaseClient()
    .from(INVENTORY_COUNTS_TABLE)
    .insert({
      count_date: today,
      title: input.title.trim() || `棚卸 ${today}`,
      status: "in_progress",
      memo: input.memo?.trim() ?? "",
    })
    .select(INVENTORY_COUNTS_SELECT)
    .single();

  if (countError) {
    throw new Error(countError.message);
  }

  const lines = products.map((p) => ({
    inventory_count_id: count.id,
    product_id: p.id,
    part_number: p.part_number,
    product_name: p.product_name,
    shelf_number: p.shelf_number,
    book_quantity: p.quantity,
    counted_quantity: null,
    variance: null,
    memo: "",
  }));

  if (lines.length > 0) {
    const { error: linesError } = await getSupabaseClient()
      .from(INVENTORY_COUNT_LINES_TABLE)
      .insert(lines);

    if (linesError) {
      throw new Error(linesError.message);
    }
  }

  const result = await fetchInventoryCountById(count.id);
  if (!result) {
    throw new Error("棚卸の作成に失敗しました。");
  }
  return result;
}

export async function updateInventoryCountLine(
  lineId: string,
  countedQuantity: number
): Promise<void> {
  const { data: line, error: fetchError } = await getSupabaseClient()
    .from(INVENTORY_COUNT_LINES_TABLE)
    .select(INVENTORY_COUNT_LINES_SELECT)
    .eq("id", lineId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const bookQty = Number(line.book_quantity);
  const variance = countedQuantity - bookQty;

  const { error } = await getSupabaseClient()
    .from(INVENTORY_COUNT_LINES_TABLE)
    .update({
      counted_quantity: countedQuantity,
      variance,
    })
    .eq("id", lineId);

  if (error) {
    throw new Error(error.message);
  }
}

/** 棚卸確定：差異を在庫に反映 */
export async function completeInventoryCount(id: string): Promise<void> {
  const count = await fetchInventoryCountById(id);
  if (!count) {
    throw new Error("棚卸が見つかりません。");
  }
  if (count.status === "completed") {
    throw new Error("この棚卸は既に確定済みです。");
  }

  for (const line of count.lines) {
    if (line.counted_quantity === null || !line.product_id) {
      continue;
    }
    if (line.variance === 0) {
      continue;
    }

    await recordInventoryAdjustment({
      productId: line.product_id,
      quantityBefore: line.book_quantity,
      quantityAfter: line.counted_quantity,
      partNumber: line.part_number,
      productName: line.product_name,
      shelfNumber: line.shelf_number,
      memo: `棚卸確定: ${count.title}`,
    });

    await getSupabaseClient()
      .from("products")
      .update({ last_inventory_count: line.counted_quantity })
      .eq("id", line.product_id);
  }

  const { error } = await getSupabaseClient()
    .from(INVENTORY_COUNTS_TABLE)
    .update({ status: "completed" })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteInventoryCount(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(INVENTORY_COUNTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export function filterInventoryCounts(
  counts: InventoryCount[],
  filter: InventoryCountFilter
): InventoryCount[] {
  return counts.filter((c) => {
    if (filter.title && !c.title.toLowerCase().includes(filter.title.toLowerCase())) {
      return false;
    }
    if (filter.status && c.status !== filter.status) {
      return false;
    }
    if (filter.dateFrom && c.count_date < filter.dateFrom) {
      return false;
    }
    if (filter.dateTo && c.count_date > filter.dateTo) {
      return false;
    }
    return true;
  });
}

export function getInventoryCountStatusLabel(status: string): string {
  return status === "completed" ? "確定" : "実施中";
}
