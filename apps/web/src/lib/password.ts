/**
 * apps/web/src/lib/password.ts
 *
 * Hash รหัสผ่านด้วย Web Crypto API (PBKDF2-HMAC-SHA256, 100,000 รอบ)
 * เลือกใช้ Web Crypto เพราะรันได้บน Cloudflare Workers runtime ตรง ๆ
 * (bcrypt/argon2 ปกติต้องพึ่ง native binding ที่ไม่มีบน Workers)
 *
 * รูปแบบที่เก็บใน DB (คอลัมน์ password_hash): "<salt-base64>:<hash-base64>"
 */

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;

function bufferToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveBits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    KEY_LENGTH_BITS
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveBits(password, salt);
  return `${bufferToBase64(salt)}:${bufferToBase64(derived)}`;
}

/** เปรียบเทียบแบบ constant-time กันเช็คเวลาแล้วเดารหัสผ่านได้ (timing attack) */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  if (!saltB64 || !hashB64) return false;

  const salt = base64ToBytes(saltB64);
  const derived = await deriveBits(password, salt);
  const computedB64 = bufferToBase64(derived);

  return constantTimeEqual(computedB64, hashB64);
}
