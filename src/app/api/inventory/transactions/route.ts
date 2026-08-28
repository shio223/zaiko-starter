import { NextResponse } from "next/server";
import { mapInventoryTransactionError } from "@/lib/api/inventory-transaction-errors";
import { createSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabase/server-admin";
import type { InventoryTransaction } from "@/lib/types/inventory-transaction";

type TransactionRequestBody = {
  productId?: string;
  partNumber?: string;
  transactionType?: "in" | "out";
  quantity?: number;
  comment?: string;
  staffCode?: string;
  location?: string;
  /** ISO 日時（KEYENCEログの Asia/Tokyo 日時など） */
  transactionAt?: string | null;
};

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "サーバー設定が完了していません。" },
      { status: 503 }
    );
  }

  let body: TransactionRequestBody;
  try {
    body = (await request.json()) as TransactionRequestBody;
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const transactionType = body.transactionType;
  const quantity = body.quantity;

  if (transactionType !== "in" && transactionType !== "out") {
    return NextResponse.json(
      { error: "transactionType は in または out を指定してください。" },
      { status: 400 }
    );
  }

  if (typeof quantity !== "number" || quantity <= 0) {
    return NextResponse.json(
      { error: "数量は1以上で入力してください。" },
      { status: 400 }
    );
  }

  const productId = body.productId?.trim() ?? "";
  const partNumber = body.partNumber?.trim() ?? "";

  if (!productId && !partNumber) {
    return NextResponse.json(
      { error: "productId または partNumber を指定してください。" },
      { status: 400 }
    );
  }

  if (productId && partNumber) {
    return NextResponse.json(
      { error: "productId と partNumber は同時に指定できません。" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const rpcArgs: Record<string, unknown> = {
    p_transaction_type: transactionType,
    p_quantity: quantity,
    p_staff_code: body.staffCode ?? null,
    p_location: body.location ?? "",
    p_comment: body.comment ?? "",
  };

  if (body.transactionAt) {
    rpcArgs.p_transaction_at = body.transactionAt;
  }

  const { data, error } = productId
    ? await supabase.rpc("apply_inventory_transaction", {
        p_product_id: productId,
        ...rpcArgs,
      })
    : await supabase.rpc("apply_inventory_transaction_by_part_number", {
        p_part_number: partNumber,
        ...rpcArgs,
      });

  if (error) {
    return NextResponse.json(
      { error: mapInventoryTransactionError(error.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({ data: data as InventoryTransaction });
}
