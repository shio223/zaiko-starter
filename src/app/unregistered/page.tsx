/**
 * 未登録リスト画面（unregistered_entries）
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  UnregisteredSearchPanel,
  UnregisteredTable,
} from "@/components/unregistered/UnregisteredPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchUnregisteredEntriesPage,
  unregisteredEntriesPageSize,
} from "@/lib/supabase/unregistered-entries";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  emptyUnregisteredEntryFilter,
  type UnregisteredEntry,
  type UnregisteredEntryFilter,
} from "@/lib/types/unregistered-entry";

export default function UnregisteredPage() {
  const [entries, setEntries] = useState<UnregisteredEntry[]>([]);
  const [filter, setFilter] = useState<UnregisteredEntryFilter>(
    emptyUnregisteredEntryFilter
  );
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fetchUnregisteredEntriesPage({
        filter,
        page,
        pageSize: unregisteredEntriesPageSize,
      });
      setEntries(result.rows);
      setTotal(result.total);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleFilterChange = (next: UnregisteredEntryFilter) => {
    setFilter(next);
    setPage(0);
  };

  const handleClearFilter = () => {
    setFilter(emptyUnregisteredEntryFilter);
    setPage(0);
  };

  const pageSize = unregisteredEntriesPageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const displayFrom = total === 0 ? 0 : page * pageSize + 1;
  const displayTo = Math.min((page + 1) * pageSize, total);

  return (
    <AppLayout>
      <PageHeader title="未登録リスト">
        <AccessButton variant="orange" onClick={loadEntries} disabled={loading}>
          更新
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <UnregisteredSearchPanel
          filter={filter}
          onChange={handleFilterChange}
          onClear={handleClearFilter}
        />

        <div className="content-main">
          <div className="text-sm content-summary flex items-center gap-3">
            <span>
              表示: {displayFrom}-{displayTo} / {total} 件（{page + 1} /{" "}
              {totalPages} ページ）
            </span>
            <AccessButton
              variant="blue"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={loading || page <= 0}
            >
              前へ
            </AccessButton>
            <AccessButton
              variant="blue"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={loading || page >= totalPages - 1}
            >
              次へ
            </AccessButton>
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読込中...</div>
          ) : (
            <UnregisteredTable entries={entries} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
