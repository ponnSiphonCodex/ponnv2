const encoder = new TextEncoder();
export type SessionPayload = { sub: string; email: string; name: string | null; exp: number };
export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
function b64u(bytes: Uint8Array): string { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64uToBytes(s: string): Uint8Array { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; const b = atob(s); const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
async function hmac(secret: string, data: string): Promise<string> { const k = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); const s = await crypto.subtle.sign("HMAC", k, encoder.encode(data)); return b64u(new Uint8Array(s)); }
export async function createSessionToken(secret: string, data: { sub: string; email: string; name: string | null }, maxAge = SESSION_MAX_AGE): Promise<string> { const p: SessionPayload = { ...data, exp: Math.floor(Date.now() / 1000) + maxAge }; const body = b64u(encoder.encode(JSON.stringify(p))); return `${body}.${await hmac(secret, body)}`; }
export async function verifySessionToken(secret: string, token: string): Promise<SessionPayload | null> { const parts = token.split("."); if (parts.length !== 2) return null; const [body, sig] = parts; if (sig !== (await hmac(secret, body))) return null; try { const p = JSON.parse(new TextDecoder().decode(b64uToBytes(body))) as SessionPayload; if (typeof p.exp !== "number" || p.exp < Math.floor(Date.now() / 1000)) return null; return p; } catch { return null; } }
export function buildSessionCookie(token: string): string { return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`; }
export function buildClearSessionCookie(): string { return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`; }
