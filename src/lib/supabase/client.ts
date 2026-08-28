/**
 * Supabase クライアントと products テーブル操作
 *
 * 接続先: 既存プロジェクト「Zaiko STARTER」
 * 環境変数: .env.local の NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PRODUCTS_SELECT, PRODUCTS_TABLE } from "@/lib/supabase/products-schema";
import type { Product, ProductFormData } from "@/lib/types/product";

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

/** 全製品を品番順で取得（Supabase 既定1000件上限を超える場合はページング） */
export async function fetchProducts(): Promise<Product[]> {
  const pageSize = 1000;
  let from = 0;
  const all: Product[] = [];

  while (true) {
    const { data, error } = await getSupabaseClient()
      .from(PRODUCTS_TABLE)
      .select(PRODUCTS_SELECT)
      .order("part_number", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    const page = (data ?? []) as unknown as Product[];
    all.push(...page);

    if (page.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return all;
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

/** 品番の重複チェック（編集時は自分自身を除外） */
export async function isPartNumberTaken(
  partNumber: string,
  excludeId?: string
): Promise<boolean> {
  const trimmed = partNumber.trim();
  if (!trimmed) {
    return false;
  }

  let query = getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .select("id")
    .eq("part_number", trimmed);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

/** 新規登録 */
export async function createProduct(
  product: ProductFormData & { print_count?: number }
): Promise<Product> {
  const payload = {
    ...product,
    print_count: product.print_count ?? 0,
  };
  const { data, error } = await getSupabaseClient()
    .from(PRODUCTS_TABLE)
    .insert(payload)
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
  product: Partial<ProductFormData & { print_count?: number }>
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
