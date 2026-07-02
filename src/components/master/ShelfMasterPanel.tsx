"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShelfSearchPanel } from "@/components/master/ShelfSearchPanel";
import { ShelfTable } from "@/components/master/ShelfTable";
import { AccessButton } from "@/components/ui/AccessButton";
import {
  countProductsUsingShelfNumber,
  deleteShelf,
  fetchShelves,
} from "@/lib/supabase/shelves";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { filterShelves } from "@/lib/utils/shelf";
import { formatShelfSaveError } from "@/lib/utils/shelf-validation";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { Shelf, ShelfSearchFilter } from "@/lib/types/shelf";

const defaultFilter: ShelfSearchFilter = {
  shelfNumber: "",
  shelfName: "",
  location: "",
  mode: "AND",
};

type ShelfMasterPanelProps = {
  onNotice: (notice: string) => void;
};

/** 棚番マスタ一覧パネル */
export function ShelfMasterPanel({ onNotice }: ShelfMasterPanelProps) {
  const router = useRouter();
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [filter, setFilter] = useState<ShelfSearchFilter>(defaultFilter);
  const [selected, setSelected] = useState<Shelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadShelves = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase（Zaiko STARTER）が未設定です。Vercel の Environment Variables を確認してください。"
      );
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchShelves();
      setShelves(data);
      setSelected((current) => {
        if (!current) return null;
        return data.find((s) => s.id === current.id) ?? null;
      });
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShelves();
  }, [loadShelves]);

  const filteredShelves = filterShelves(shelves, filter);

  const goToEdit = (shelf: Shelf) => {
    router.push(`/master/shelf/${shelf.id}/edit`);
  };

  const handleDelete = async () => {
    if (!selected) {
      alert("削除する棚番を選択してください。");
      return;
    }

    try {
      const usedCount = await countProductsUsingShelfNumber(selected.shelf_number);
      let message = `「${selected.shelf_name}」（棚番: ${selected.shelf_number}）を削除しますか？`;
      if (usedCount > 0) {
        message += `\n\n※ この棚番を使っている製品が ${usedCount} 件あります。`;
      }

      const confirmed = window.confirm(message);
      if (!confirmed) return;

      setDeleting(true);
      await deleteShelf(selected.id);
      setSelected(null);
      onNotice("shelf_deleted");
      await loadShelves();
    } catch (err) {
      alert(formatShelfSaveError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="page-header-actions mb-3">
        <Link href="/master/shelf/new">
          <AccessButton variant="green">新規登録</AccessButton>
        </Link>
        <AccessButton
          variant="blue"
          onClick={() => selected && goToEdit(selected)}
          disabled={!selected}
        >
          編集
        </AccessButton>
        <AccessButton
          variant="red"
          onClick={handleDelete}
          disabled={!selected || deleting}
        >
          {deleting ? "削除中..." : "削除"}
        </AccessButton>
        <AccessButton variant="orange" onClick={loadShelves} disabled={loading}>
          更新
        </AccessButton>
      </div>

      {error && (
        <div className="access-panel mb-3 border-2 border-red-600 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="content-layout">
        <ShelfSearchPanel
          filter={filter}
          onChange={setFilter}
          onClear={() => setFilter(defaultFilter)}
        />

        <div className="content-main">
          <div className="text-sm content-summary">
            表示件数: {filteredShelves.length} / {shelves.length} 件
            {selected && (
              <span className="content-summary-selected">
                選択中: {selected.shelf_number} - {selected.shelf_name}
              </span>
            )}
          </div>

          {loading ? (
            <div className="access-panel p-4 text-center text-sm">
              読み込み中...
            </div>
          ) : (
            <ShelfTable
              shelves={filteredShelves}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              onEdit={goToEdit}
            />
          )}
        </div>
      </div>
    </>
  );
}
