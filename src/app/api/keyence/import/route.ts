import { NextResponse } from "next/server";
import { mapInventoryTransactionError } from "@/lib/api/inventory-transaction-errors";
import {
  createSupabaseAdmin,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server-admin";
import {
  HANDHELD_IMPORT_LOG_LINES_TABLE,
  HANDHELD_IMPORT_LOGS_TABLE,
  UNREGISTERED_ENTRIES_TABLE,
} from "@/lib/supabase/handheld-import-schema";
import {
  KEYENCE_DUPLICATE_FILE_MESSAGE,
  KEYENCE_MODE3_MESSAGE,
  type KeyenceApplyResult,
} from "@/lib/types/keyence-import";
import { parseKeyenceLogText } from "@/lib/utils/keyence-parser";
import { sha256Hex } from "@/lib/utils/sha256";
import type { InventoryTransaction } from "@/lib/types/inventory-transaction";

type ImportRequestBody = {
  fileName?: string;
  fileContent?: string;
  fileContentHash?: string;
};

type LineResult =
  | "applied"
  | "skipped_mode3"
  | "skipped_unregistered"
  | "failed"
  | "duplicate"
  | "skipped_other";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "サーバー設定が完了していません。" },
      { status: 503 }
    );
  }

  let body: ImportRequestBody;
  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const fileName = (body.fileName ?? "").trim() || "unknown.txt";
  const fileContent = body.fileContent ?? "";
  const clientHash = (body.fileContentHash ?? "").trim().toLowerCase();

  if (!fileContent) {
    return NextResponse.json(
      { error: "ファイル内容が空です。" },
      { status: 400 }
    );
  }

  const fileContentHash = (await sha256Hex(fileContent)).toLowerCase();
  if (clientHash && clientHash !== fileContentHash) {
    return NextResponse.json(
      { error: "ファイルハッシュが一致しません。" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();

  const { data: existing, error: existingErr } = await supabase
    .from(HANDHELD_IMPORT_LOGS_TABLE)
    .select("id")
    .eq("file_content_hash", fileContentHash)
    .limit(1);

  if (existingErr) {
    return NextResponse.json(
      {
        error:
          existingErr.message.includes("does not exist") ||
          existingErr.code === "42P01" ||
          existingErr.code === "PGRST205"
            ? "監査ログテーブルが未作成です。014 / 015 を適用してください。"
            : existingErr.message,
      },
      { status: 503 }
    );
  }

  if ((existing?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: KEYENCE_DUPLICATE_FILE_MESSAGE, rejectedDuplicate: true },
      { status: 409 }
    );
  }

  const parsed = parseKeyenceLogText(fileContent, fileName);
  if (parsed.rows.length === 0) {
    return NextResponse.json(
      { error: parsed.parseErrors.join(" ") || "取り込めるデータがありません。" },
      { status: 400 }
    );
  }

  const deviceId =
    parsed.rows.find((r) => r.device_id)?.device_id ?? "";

  const { data: logHeader, error: logErr } = await supabase
    .from(HANDHELD_IMPORT_LOGS_TABLE)
    .insert({
      file_name: fileName,
      file_content_hash: fileContentHash,
      log_kind: parsed.logKind === "unknown" ? "inout" : parsed.logKind,
      device_id: deviceId,
      row_count: parsed.rows.length,
      success_count: 0,
      failed_count: 0,
      skipped_count: 0,
      status: "partial",
      error_summary: "",
      raw_text: fileContent.length > 200_000 ? null : fileContent,
    })
    .select("id")
    .single();

  if (logErr || !logHeader) {
    if (logErr?.code === "23505") {
      return NextResponse.json(
        { error: KEYENCE_DUPLICATE_FILE_MESSAGE, rejectedDuplicate: true },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: logErr?.message ?? "監査ログの作成に失敗しました。" },
      { status: 500 }
    );
  }

  const importLogId = logHeader.id as string;

  // 品番マスタ（正確一致・先頭ゼロ保持）
  const partNumbers = [
    ...new Set(parsed.rows.map((r) => r.part_number).filter(Boolean)),
  ];
  const productByPart = new Map<
    string,
    { id: string; part_number: string; shelf_code: string; quantity: number }
  >();

  if (partNumbers.length > 0) {
    // PostgREST in() は長いと切れるためチャンク
    for (let i = 0; i < partNumbers.length; i += 200) {
      const chunk = partNumbers.slice(i, i + 200);
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("id,part_number,shelf_code,quantity")
        .in("part_number", chunk);
      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 });
      }
      for (const p of products ?? []) {
        productByPart.set(p.part_number as string, {
          id: p.id as string,
          part_number: p.part_number as string,
          shelf_code: (p.shelf_code as string) ?? "",
          quantity: Number(p.quantity ?? 0),
        });
      }
    }
  }

  let success = 0;
  let unregistered = 0;
  let mode3Skipped = 0;
  let failed = 0;
  let skippedOther = 0;
  const errors: string[] = [];
  const lineInserts: Record<string, unknown>[] = [];

  for (const row of parsed.rows) {
    const baseLine = {
      import_log_id: importLogId,
      line_number: row.lineNumber,
      scanned_at: row.scanned_at,
      device_id: row.device_id,
      mode: row.mode,
      staff_code: row.staff_code || null,
      shelf_code: row.shelf_code,
      part_number: row.part_number,
      quantity: row.quantity,
    };

    const pushLine = (
      result: LineResult,
      resultMessage: string,
      extra?: { inventory_transaction_id?: string; unregistered_entry_id?: string }
    ) => {
      lineInserts.push({
        ...baseLine,
        result,
        result_message: resultMessage,
        inventory_transaction_id: extra?.inventory_transaction_id ?? null,
        unregistered_entry_id: extra?.unregistered_entry_id ?? null,
      });
    };

    if (row.mode === 3) {
      mode3Skipped += 1;
      pushLine("skipped_mode3", KEYENCE_MODE3_MESSAGE);
      continue;
    }

    if (row.mode !== 1 && row.mode !== 2) {
      skippedOther += 1;
      pushLine("skipped_other", "モードが不正です。");
      continue;
    }

    if (!row.part_number) {
      failed += 1;
      const msg = "品番が空です。";
      errors.push(`${row.lineNumber}行目: ${msg}`);
      pushLine("failed", msg);
      continue;
    }

    if (row.quantity === null || row.quantity <= 0) {
      failed += 1;
      const msg = "数量が不正です。";
      errors.push(`${row.lineNumber}行目: ${msg}`);
      pushLine("failed", msg);
      continue;
    }

    const product = productByPart.get(row.part_number);
    if (!product) {
      unregistered += 1;
      const { data: ure, error: ureErr } = await supabase
        .from(UNREGISTERED_ENTRIES_TABLE)
        .insert({
          import_log_id: importLogId,
          scanned_at: row.scanned_at,
          device_id: row.device_id,
          mode: row.mode,
          staff_code: row.staff_code || null,
          shelf_code: row.shelf_code,
          part_number: row.part_number,
          quantity: row.quantity,
          status: "open",
          note: "KEYENCE取込: マスタ未登録",
        })
        .select("id")
        .single();

      if (ureErr) {
        failed += 1;
        errors.push(`${row.lineNumber}行目: 未登録保存失敗: ${ureErr.message}`);
        pushLine("failed", ureErr.message);
      } else {
        pushLine("skipped_unregistered", "未登録", {
          unregistered_entry_id: ure.id as string,
        });
      }
      continue;
    }

    const transactionType = row.mode === 1 ? "in" : "out";
    const { data: tx, error: txErr } = await supabase.rpc(
      "apply_inventory_transaction",
      {
        p_product_id: product.id,
        p_transaction_type: transactionType,
        p_quantity: row.quantity,
        p_staff_code: row.staff_code || null,
        p_location: "",
        p_comment: `KEYENCE ${fileName}`,
        p_transaction_at: row.scanned_at,
      }
    );

    if (txErr || !tx) {
      failed += 1;
      const msg = mapInventoryTransactionError(
        txErr?.message ?? "入出庫処理に失敗しました。"
      );
      errors.push(`${row.lineNumber}行目: ${msg}`);
      pushLine("failed", msg);
      continue;
    }

    const transaction = tx as InventoryTransaction;

    // ログの棚番を履歴スナップショットとして保持（空でなければ）
    if (row.shelf_code) {
      await supabase
        .from("inventory_transactions")
        .update({ shelf_code: row.shelf_code })
        .eq("id", transaction.id);
    }

    success += 1;
    // 後続行の出庫判定用にメモリ上の在庫も更新
    product.quantity =
      transactionType === "in"
        ? product.quantity + row.quantity
        : product.quantity - row.quantity;

    pushLine("applied", "OK", {
      inventory_transaction_id: transaction.id,
    });
  }

  if (lineInserts.length > 0) {
    for (let i = 0; i < lineInserts.length; i += 200) {
      const chunk = lineInserts.slice(i, i + 200);
      const { error: lineErr } = await supabase
        .from(HANDHELD_IMPORT_LOG_LINES_TABLE)
        .insert(chunk);
      if (lineErr) {
        errors.push(`監査明細の保存に失敗: ${lineErr.message}`);
      }
    }
  }

  const skipped_count = mode3Skipped + unregistered + skippedOther;
  const status =
    failed > 0 || skipped_count > 0
      ? success > 0
        ? "partial"
        : "completed"
      : "completed";

  await supabase
    .from(HANDHELD_IMPORT_LOGS_TABLE)
    .update({
      success_count: success,
      failed_count: failed,
      skipped_count,
      status,
      error_summary: errors.slice(0, 20).join(" / "),
    })
    .eq("id", importLogId);

  const result: KeyenceApplyResult = {
    success,
    unregistered,
    mode3Skipped,
    failed,
    skippedOther,
    errors,
    importLogId,
    rejectedDuplicate: false,
  };

  return NextResponse.json(result);
}
