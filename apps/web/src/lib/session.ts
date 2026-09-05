/**
 * apps/web/src/lib/session.ts
 * ระบบ session เขียนเอง (แทน NextAuth) — signed cookie HMAC-SHA256 ผ่าน Web Crypto
 */
const encoder = new TextEncoder();

export type SessionPayload = { sub: string; email: string; name: string | null; exp: number };
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = ""; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const bin = atob(s); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return bytes;
}
function encodeJson(obj: unknown): string { return bytesToBase64url(encoder.encode(JSON.stringify(obj))); }
function decodeJson<T>(b64: string): T { return JSON.parse(new TextDecoder().decode(base64urlToBytes(b64))) as T; }

async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return bytesToBase64url(new Uint8Array(sig));
}

export async function createSessionToken(secret: string, data: { sub: string; email: string; name: string | null }, maxAgeSec = SESSION_MAX_AGE): Promise<string> {
  const payload: SessionPayload = { ...data, exp: Math.floor(Date.now() / 1000) + maxAgeSec };
  const body = encodeJson(payload); const sig = await hmacSign(secret, body);
  return `${body}.${sig}`;
}
export async function verifySessionToken(secret: string, token: string): Promise<SessionPayload | null> {
  const parts = token.split("."); if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = await hmacSign(secret, body); if (sig !== expected) return null;
  try { const payload = decodeJson<SessionPayload>(body); if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null; return payload; } catch { return null; }
}
export function buildSessionCookie(token: string): string { return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`; }
export function buildClearSessionCookie(): string { return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`; }
