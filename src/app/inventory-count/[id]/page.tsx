/**
 * 棚卸明細画面
 */
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccessButton } from "@/components/ui/AccessButton";
import { AccessInput } from "@/components/ui/AccessInput";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  completeInventoryCount,
  fetchInventoryCountById,
  getInventoryCountStatusLabel,
  updateInventoryCountLine,
} from "@/lib/supabase/inventory-counts";
import { formatNumber } from "@/lib/utils/product";
import { formatSupabaseError } from "@/lib/utils/supabase-error";
import type { InventoryCountWithLines } from "@/lib/types/inventory-count";

export default function InventoryCountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [count, setCount] = useState<InventoryCountWithLines | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingLineId, setSavingLineId] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const loadCount = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase（Zaiko STARTER）が未設定です。");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchInventoryCountById(id);
      if (!data) {
        setError("棚卸が見つかりません。");
        return;
      }
      setCount(data);
      const nextDrafts: Record<string, string> = {};
      for (const line of data.lines) {
        nextDrafts[line.id] =
          line.counted_quantity !== null ? String(line.counted_quantity) : "";
      }
      setDrafts(nextDrafts);
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const handleSaveLine = async (lineId: string) => {
    const value = drafts[lineId];
    if (value === "" || Number.isNaN(Number(value))) {
      alert("実棚数を入力してください。");
      return;
    }

    try {
      setSavingLineId(lineId);
      await updateInventoryCountLine(lineId, Number(value));
      await loadCount();
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSavingLineId(null);
    }
  };

  const handleComplete = async () => {
    if (!count) return;

    const uncounted = count.lines.filter((l) => l.counted_quantity === null);
    if (uncounted.length > 0) {
      const proceed = window.confirm(
        `未入力の明細が ${uncounted.length} 件あります。確定しますか？`
      );
      if (!proceed) return;
    } else {
      const proceed = window.confirm(
        "棚卸を確定し、差異を在庫に反映します。よろしいですか？"
      );
      if (!proceed) return;
    }

    try {
      setCompleting(true);
      await completeInventoryCount(count.id);
      router.push("/inventory-count");
    } catch (err) {
      alert(err instanceof Error ? err.message : "確定に失敗しました。");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title="棚卸明細" />
        <div className="access-panel p-4 text-center text-sm">読み込み中...</div>
      </AppLayout>
    );
  }

  if (!count) {
    return (
      <AppLayout>
        <PageHeader title="棚卸明細" />
        <div className="access-panel p-4 text-center text-sm text-red-700">
          {error ?? "棚卸が見つかりません。"}
        </div>
      </AppLayout>
    );
  }

  const isCompleted = count.status === "completed";

  return (
    <AppLayout>
      <PageHeader title={`棚卸明細 - ${count.title}`}>
        {!isCompleted && (
          <AccessButton
            variant="green"
            onClick={handleComplete}
            disabled={completing}
          >
            {completing ? "確定中..." : "棚卸確定"}
          </AccessButton>
        )}
        <AccessButton
          variant="orange"
          onClick={() => router.push("/inventory-count")}
        >
          一覧へ戻る
        </AccessButton>
      </PageHeader>

      <div className="access-panel mb-3 p-3 text-sm">
        日付: {count.count_date} / 状態: {getInventoryCountStatusLabel(count.status)}
        {count.memo && ` / 備考: ${count.memo}`}
      </div>

      <div className="table-scroll-wrapper access-panel">
        <table className="access-table">
          <thead>
            <tr>
              <th>品番</th>
              <th>品名</th>
              <th>棚番</th>
              <th>帳簿在庫</th>
              <th>実棚数</th>
              <th>差異</th>
              {!isCompleted && <th>操作</th>}
            </tr>
          </thead>
          <tbody>
            {count.lines.map((line) => (
              <tr key={line.id}>
                <td>{line.part_number}</td>
                <td>{line.product_name}</td>
                <td>{line.shelf_number}</td>
                <td className="text-right">{formatNumber(line.book_quantity)}</td>
                <td>
                  {isCompleted ? (
                    <span className="text-right block">
                      {line.counted_quantity !== null
                        ? formatNumber(line.counted_quantity)
                        : "-"}
                    </span>
                  ) : (
                    <AccessInput
                      id={`count-${line.id}`}
                      type="number"
                      min={0}
                      step="any"
                      value={drafts[line.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [line.id]: e.target.value,
                        }))
                      }
                      className="mb-0"
                    />
                  )}
                </td>
                <td className="text-right">
                  {line.variance !== null ? formatNumber(line.variance) : "-"}
                </td>
                {!isCompleted && (
                  <td>
                    <AccessButton
                      variant="blue"
                      onClick={() => handleSaveLine(line.id)}
                      disabled={savingLineId === line.id}
                    >
                      {savingLineId === line.id ? "保存中" : "保存"}
                    </AccessButton>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
