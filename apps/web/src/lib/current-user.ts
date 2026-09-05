/**
 * apps/web/src/lib/current-user.ts
 * อ่าน session cookie แล้ว verify → คืนข้อมูล user (ใช้ในหน้า server component)
 */
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken, type SessionPayload } from "./session";

export async function getCurrentUser(secret: string): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(secret, token);
}
