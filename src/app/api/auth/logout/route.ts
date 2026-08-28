import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
