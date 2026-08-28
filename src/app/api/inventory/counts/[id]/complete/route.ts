import { NextResponse } from "next/server";
import { mapInventoryCountError } from "@/lib/api/inventory-count-errors";
import {
  createSupabaseAdmin,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/server-admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type CompleteBody = {
  staffCode?: string;
  location?: string;
  comment?: string;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { error: "サーバー設定が完了していません。" },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "棚卸が指定されていません。" }, { status: 400 });
  }

  let body: CompleteBody = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text) as CompleteBody;
    }
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.rpc("complete_inventory_count", {
    p_count_id: id,
    p_staff_code: body.staffCode ?? null,
    p_location: body.location ?? "",
    p_comment: body.comment ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: mapInventoryCountError(error.message) },
      { status: 400 }
    );
  }

  return NextResponse.json({ data });
}
