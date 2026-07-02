/**
 * 棚卸リスト画面
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  InventoryCountSearchPanel,
  InventoryCountTable,
} from "@/components/inventory-count/InventoryCountPanel";
import { AccessButton } from "@/components/ui/AccessButton";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  deleteInventoryCount,
  fetchInventoryCounts,
  filterInventoryCounts,
} from "@/lib/supabase/inventory-counts";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import {
  emptyInventoryCountFilter,
  type InventoryCount,
  type InventoryCountFilter,
} from "@/lib/types/inventory-count";

export default function InventoryCountPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [filter, setFilter] = useState<InventoryCountFilter>(
    emptyInventoryCountFilter
  );
  const [selected, setSelected] = useState<InventoryCount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCounts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchInventoryCounts();
      setCounts(data);
      setSelected((current) => {
        if (!current) return null;
        return data.find((c) => c.id === current.id) ?? null;
      });
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const filtered = useMemo(
    () => filterInventoryCounts(counts, filter),
    [counts, filter]
  );

  const openDetail = (count: InventoryCount) => {
    router.push(`/inventory-count/${count.id}`);
  };

  const handleDelete = async () => {
    if (!selected) {
      alert("削除する棚卸を選択してください。");
      return;
    }
    if (selected.status === "completed") {
      alert("確定済みの棚卸は削除できません。");
      return;
    }

    const confirmed = window.confirm(`「${selected.title}」を削除しますか？`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteInventoryCount(selected.id);
      setSelected(null);
      await loadCounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="棚卸リスト">
        <Link href="/inventory-start">
          <AccessButton variant="green">棚卸開始</AccessButton>
        </Link>
        <AccessButton
          variant="blue"
          onClick={() => selected && openDetail(selected)}
          disabled={!selected}
        >
          明細
        </AccessButton>
        <AccessButton
          variant="red"
          onClick={handleDelete}
          disabled={!selected || deleting || selected?.status === "completed"}
        >
          {deleting ? "削除中..." : "削除"}
        </AccessButton>
        <AccessButton variant="orange" onClick={loadCounts} disabled={loading}>
          更新
        </AccessButton>
      </PageHeader>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <InventoryCountSearchPanel
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter(emptyInventoryCountFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {filtered.length} / {counts.length} 件
          </div>
          {loading ? (
            <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
          ) : (
            <InventoryCountTable
              counts={filtered}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onOpen={openDetail}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
