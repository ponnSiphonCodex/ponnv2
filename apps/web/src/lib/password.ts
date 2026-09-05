/**
 * apps/web/src/lib/password.ts
 *
 * Password hashing สำหรับ Local Email+Password login — ใช้ PBKDF2-SHA256 ผ่าน Web Crypto
 * (crypto.subtle) แทนไลบรารีนอก เช่น bcryptjs เพราะ Web Crypto รองรับ native บน Cloudflare
 * Workers runtime อยู่แล้ว (ไม่ต้องพึ่ง native binding ที่บาง edge runtime รันไม่ได้)
 *
 * รูปแบบที่เก็บใน DB (คอลัมน์ users.password_hash):
 *   "<iterations>:<saltHex>:<hashHex>"
 *
 * ทดสอบแล้วว่า algorithm นี้ให้ผลตรงกันทั้งบน Node.js (>=19, มี globalThis.crypto.subtle)
 * และ Cloudflare Workers — ใช้ generate hash ทดสอบได้ด้วย node ตรง ๆ (ดู DEPLOY_GUIDE_GUI.md)
 */

const PBKDF2_ITERATIONS = 100_000;

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${PBKDF2_ITERATIONS}:${toHex(salt.buffer)}:${toHex(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 3) return false;

  const [iterStr, saltHex, hashHex] = parts;
  const iterations = Number(iterStr);
  const salt = fromHex(saltHex);

  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256);
  return toHex(bits) === hashHex;
}
