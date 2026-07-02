/**
 * Supabase クライアントと products テーブル操作
 *
 * 接続先: 既存プロジェクト「Zaiko STARTER」
 * 環境変数: .env.local の NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PRODUCTS_SELECT, PRODUCTS_TABLE } from "@/lib/supabase/products-schema";
import type { Product } from "@/lib/types/product";

// クライアントは1つだけ生成（遅延初期化）
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

/** .env.local に Supabase 接続情報が設定されているか */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** 全製品を品番順で取得 */
export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCTS_SELECT)
    .order("part_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Product[];
}

/** ID で1件取得（編集画面用） */
export async function fetchProductById(id: string): Promise<Product | null> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select(PRODUCTS_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // 該当データなし
    }
    throw new Error(error.message);
  }

  return data as Product;
}

/** 新規登録 */
export async function createProduct(
  product: Omit<Product, "id" | "stock_amount" | "created_at" | "updated_at">
): Promise<Product> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .insert(product)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}

/** 更新 */
export async function updateProduct(
  id: string,
  product: Partial<Omit<Product, "id" | "created_at" | "updated_at">>
): Promise<Product> {
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .update(product)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
}

/** 削除 */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
