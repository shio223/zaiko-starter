/**
 * 入出庫履歴・在庫更新
 *
 * 入庫/出庫の書き込みは認証付き API Route 経由（service_role → RPC）
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  STOCK_MOVEMENTS_SELECT,
  STOCK_MOVEMENTS_TABLE,
} from "@/lib/supabase/stock-movements-schema";
import { PRODUCTS_TABLE } from "@/lib/supabase/products-schema";
import { updateProduct } from "@/lib/supabase/client";
import type { InventoryTransaction } from "@/lib/types/inventory-transaction";
import type { MovementType, StockMovement } from "@/lib/types/stock-movement";

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

function toStockMovement(row: InventoryTransaction): StockMovement {
  return {
    id: row.id,
    product_id: row.product_id,
    movement_type: row.transaction_type,
    quantity:
      row.transaction_type === "in" ? row.inbound_qty : row.outbound_qty,
    quantity_before: row.previous_stock,
    quantity_after: row.current_stock,
    part_number: row.part_number,
    product_name: "",
    shelf_number: row.shelf_code,
    memo: row.comment,
    performed_at: row.transaction_at,
    created_at: row.created_at,
  };
}

async function callInventoryTransactionApi(input: {
  productId?: string;
  partNumber?: string;
  transactionType: "in" | "out";
  quantity: number;
  comment?: string;
}): Promise<InventoryTransaction> {
  const res = await fetch("/api/inventory/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      productId: input.productId,
      partNumber: input.partNumber,
      transactionType: input.transactionType,
      quantity: input.quantity,
      comment: input.comment ?? "",
    }),
  });

  const json = (await res.json()) as {
    data?: InventoryTransaction;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(json.error ?? "入出庫処理に失敗しました。");
  }

  if (!json.data) {
    throw new Error("入出庫処理に失敗しました。");
  }

  return json.data;
}

export async function fetchStockMovements(): Promise<StockMovement[]> {
  const { data, error } = await getSupabaseClient()
    .from(STOCK_MOVEMENTS_TABLE)
    .select(STOCK_MOVEMENTS_SELECT)
    .order("performed_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as StockMovement[];
}

type PerformStockMovementInput = {
  productId: string;
  movementType: "in" | "out";
  quantity: number;
  memo?: string;
};

/** 入庫・出庫を実行（API Route → RPC） */
export async function performStockMovement(
  input: PerformStockMovementInput
): Promise<StockMovement> {
  const { productId, movementType, quantity, memo = "" } = input;

  if (quantity <= 0) {
    throw new Error("数量は1以上で入力してください。");
  }

  const row = await callInventoryTransactionApi({
    productId,
    transactionType: movementType,
    quantity,
    comment: memo.trim(),
  });

  return toStockMovement(row);
}

/** 棚卸確定時の在庫調整（第2段階では従来経路のまま） */
export async function recordInventoryAdjustment(input: {
  productId: string;
  quantityBefore: number;
  quantityAfter: number;
  partNumber: string;
  productName: string;
  shelfNumber: string;
  memo?: string;
}): Promise<void> {
  const delta = Math.abs(input.quantityAfter - input.quantityBefore);
  if (delta === 0) {
    return;
  }

  await updateProduct(input.productId, { quantity: input.quantityAfter });

  const { error } = await getSupabaseClient()
    .from(STOCK_MOVEMENTS_TABLE)
    .insert({
      product_id: input.productId,
      movement_type: "adjust" as MovementType,
      quantity: delta,
      quantity_before: input.quantityBefore,
      quantity_after: input.quantityAfter,
      part_number: input.partNumber,
      product_name: input.productName,
      shelf_number: input.shelfNumber,
      memo: input.memo?.trim() ?? "棚卸調整",
    });

  if (error) {
    throw new Error(error.message);
  }
}

/** KEYENCE取込：品番で入出庫 */
export async function performStockMovementByPartNumber(input: {
  partNumber: string;
  movementType: "in" | "out";
  quantity: number;
  memo?: string;
}): Promise<StockMovement> {
  const trimmed = input.partNumber.trim();
  if (!trimmed) {
    throw new Error("品番が空です。");
  }

  const row = await callInventoryTransactionApi({
    partNumber: trimmed,
    transactionType: input.movementType,
    quantity: input.quantity,
    comment: input.memo?.trim() ?? "",
  });

  return toStockMovement(row);
}

/** 品番存在確認（KEYENCE取込用・読取のみ） */
export async function findProductIdByPartNumber(
  partNumber: string
): Promise<string | null> {
  const trimmed = partNumber.trim();
  if (!trimmed) {
    return null;
  }

  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select("id")
    .eq("part_number", trimmed)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0]?.id ?? null;
}
