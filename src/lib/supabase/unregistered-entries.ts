/**
 * unregistered_entries 読取（Supabase 側フィルタ＋ページング）
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  UNREGISTERED_ENTRIES_SELECT,
  UNREGISTERED_ENTRIES_TABLE,
} from "@/lib/supabase/unregistered-entries-schema";
import type {
  UnregisteredEntry,
  UnregisteredEntryFilter,
  UnregisteredEntriesPage,
} from "@/lib/types/unregistered-entry";

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

function buildFilteredQuery(filter: UnregisteredEntryFilter) {
  let query = getSupabaseClient()
    .from(UNREGISTERED_ENTRIES_TABLE)
    .select(UNREGISTERED_ENTRIES_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  const partNumber = filter.partNumber.trim();
  if (partNumber) {
    query = query.ilike("part_number", `%${escapeIlikePattern(partNumber)}%`);
  }

  const shelfCode = filter.shelfCode.trim();
  if (shelfCode) {
    query = query.ilike("shelf_code", `%${escapeIlikePattern(shelfCode)}%`);
  }

  if (filter.mode === "1" || filter.mode === "2" || filter.mode === "3") {
    query = query.eq("mode", Number(filter.mode));
  }

  if (filter.status === "open" || filter.status === "resolved") {
    query = query.eq("status", filter.status);
  }

  if (filter.dateFrom) {
    query = query.gte("created_at", `${filter.dateFrom}T00:00:00`);
  }

  if (filter.dateTo) {
    query = query.lte("created_at", `${filter.dateTo}T23:59:59.999`);
  }

  return query;
}

export async function fetchUnregisteredEntriesPage(input: {
  filter: UnregisteredEntryFilter;
  page?: number;
  pageSize?: number;
}): Promise<UnregisteredEntriesPage> {
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
    rows: (data ?? []) as unknown as UnregisteredEntry[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

export const unregisteredEntriesPageSize = DEFAULT_PAGE_SIZE;
