/**
 * Supabase shelves テーブル操作（棚番マスタ）
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SHELVES_SELECT, SHELVES_TABLE } from "@/lib/supabase/shelves-schema";
import type { Shelf } from "@/lib/types/shelf";

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

export async function fetchShelves(): Promise<Shelf[]> {
  const { data, error } = await getSupabaseClient()
    .from(SHELVES_TABLE)
    .select(SHELVES_SELECT)
    .order("shelf_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Shelf[];
}

export async function fetchShelfById(id: string): Promise<Shelf | null> {
  const { data, error } = await getSupabaseClient()
    .from(SHELVES_TABLE)
    .select(SHELVES_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(error.message);
  }

  return data as Shelf;
}

export async function isShelfNumberTaken(
  shelfNumber: string,
  excludeId?: string
): Promise<boolean> {
  const trimmed = shelfNumber.trim();
  if (!trimmed) {
    return false;
  }

  let query = getSupabaseClient()
    .from(SHELVES_TABLE)
    .select("id")
    .eq("shelf_number", trimmed);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

export async function countProductsUsingShelfNumber(
  shelfNumber: string
): Promise<number> {
  const trimmed = shelfNumber.trim();
  if (!trimmed) {
    return 0;
  }

  const { count, error } = await getSupabaseClient()
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shelf_number", trimmed);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function createShelf(
  shelf: Omit<Shelf, "id" | "created_at" | "updated_at">
): Promise<Shelf> {
  const { data, error } = await getSupabaseClient()
    .from(SHELVES_TABLE)
    .insert(shelf)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Shelf;
}

export async function updateShelf(
  id: string,
  shelf: Partial<Omit<Shelf, "id" | "created_at" | "updated_at">>
): Promise<Shelf> {
  const { data, error } = await getSupabaseClient()
    .from(SHELVES_TABLE)
    .update(shelf)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Shelf;
}

export async function deleteShelf(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from(SHELVES_TABLE)
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
