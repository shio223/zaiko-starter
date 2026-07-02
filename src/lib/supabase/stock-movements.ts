/**
 * Supabase stock_movements テーブル操作
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  STOCK_MOVEMENTS_SELECT,
  STOCK_MOVEMENTS_TABLE,
} from "@/lib/supabase/stock-movements-schema";
import { PRODUCTS_TABLE } from "@/lib/supabase/products-schema";
import { fetchProductById, updateProduct } from "@/lib/supabase/client";
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

/** 入庫・出庫を実行（在庫数更新＋履歴記録） */
export async function performStockMovement(
  input: PerformStockMovementInput
): Promise<StockMovement> {
  const { productId, movementType, quantity, memo = "" } = input;

  if (quantity <= 0) {
    throw new Error("数量は1以上で入力してください。");
  }

  const product = await fetchProductById(productId);
  if (!product) {
    throw new Error("対象の製品が見つかりません。");
  }

  const quantityBefore = product.quantity;
  const delta = movementType === "in" ? quantity : -quantity;
  const quantityAfter = quantityBefore + delta;

  if (quantityAfter < 0) {
    throw new Error("出庫後の在庫数がマイナスになります。");
  }

  await updateProduct(productId, { quantity: quantityAfter });

  const { data, error } = await getSupabaseClient()
    .from(STOCK_MOVEMENTS_TABLE)
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      part_number: product.part_number,
      product_name: product.product_name,
      shelf_number: product.shelf_number,
      memo: memo.trim(),
    })
    .select(STOCK_MOVEMENTS_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as unknown as StockMovement;
}

/** 棚卸確定時の在庫調整 */
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

  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select("id")
    .eq("part_number", trimmed)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.[0]) {
    throw new Error(`品番「${trimmed}」は未登録です。`);
  }

  return performStockMovement({
    productId: data[0].id,
    movementType: input.movementType,
    quantity: input.quantity,
    memo: input.memo,
  });
}
