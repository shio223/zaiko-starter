/**
 * アプリ共有パスワード照合（タイミング攻撃対策）
 */
import { timingSafeEqual } from "node:crypto";

export function verifyAppPassword(input: string): boolean {
  const expected = process.env.APP_AUTH_PASSWORD;
  if (!expected) {
    return false;
  }

  const a = Buffer.from(input, "utf8");
  const b = Buffer.from(expected, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.APP_AUTH_PASSWORD &&
      process.env.SESSION_SECRET &&
      process.env.SESSION_SECRET.length >= 16
  );
}
