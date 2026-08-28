/**
 * 署名付き HttpOnly Cookie セッション（Edge / Node 共通）
 */
const SESSION_COOKIE_NAME = "zaiko_session";
const SESSION_VERSION = 1;
const SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12時間

export type SessionPayload = {
  v: number;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is not configured");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padLen);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payloadJson: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadJson));
  return toBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const payload: SessionPayload = {
    v: SESSION_VERSION,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = toBase64Url(new TextEncoder().encode(payloadJson));
  const signature = await signPayload(payloadJson, getSessionSecret());
  return `${payloadB64}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) {
    return false;
  }

  let payloadJson: string;
  try {
    payloadJson = new TextDecoder().decode(fromBase64Url(payloadB64));
  } catch {
    return false;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(payloadJson) as SessionPayload;
  } catch {
    return false;
  }

  if (payload.v !== SESSION_VERSION || typeof payload.exp !== "number") {
    return false;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedSignature = await signPayload(payloadJson, getSessionSecret());
  if (expectedSignature.length !== signatureB64.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < expectedSignature.length; i += 1) {
    mismatch |= expectedSignature.charCodeAt(i) ^ signatureB64.charCodeAt(i);
  }
  return mismatch === 0;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export async function isAuthenticatedRequest(
  cookieValue: string | undefined
): Promise<boolean> {
  try {
    return await verifySessionToken(cookieValue);
  } catch {
    return false;
  }
}
