import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  isAuthenticatedRequest,
} from "@/lib/auth/session";
import { isAuthConfigured, verifyAppPassword } from "@/lib/auth/password";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "認証設定が完了していません。" },
      { status: 503 }
    );
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です。" },
      { status: 400 }
    );
  }

  const password = body.password ?? "";
  if (!verifyAppPassword(password)) {
    return NextResponse.json(
      { error: "パスワードが正しくありません。" },
      { status: 401 }
    );
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), token, getSessionCookieOptions());
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(getSessionCookieName())?.value;
  const authenticated = await isAuthenticatedRequest(session);
  return NextResponse.json({ authenticated });
}
