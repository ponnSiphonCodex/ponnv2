const PBKDF2_ITERATIONS = 100_000;
function toHex(buffer: ArrayBuffer): string { return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function fromHex(hex: string): Uint8Array { const bytes = new Uint8Array(hex.length / 2); for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16); return bytes; }
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" }, km, 256);
  return `${PBKDF2_ITERATIONS}:${toHex(salt.buffer)}:${toHex(bits)}`;
}
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":"); if (parts.length !== 3) return false;
  const [iterStr, saltHex, hashHex] = parts;
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: fromHex(saltHex), iterations: Number(iterStr), hash: "SHA-256" }, km, 256);
  return toHex(bits) === hashHex;
}
