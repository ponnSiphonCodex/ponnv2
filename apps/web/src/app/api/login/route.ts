import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, buildSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }); }
  const email = body.email?.trim(); const password = body.password;
  if (!email || !password) return Response.json({ ok: false, error: "อีเมลและรหัสผ่านห้ามว่าง" }, { status: 400 });

  // ถ้าไม่มี AUTH_SECRET จะ sign token ไม่ได้ → บอก error ที่อ่านรู้เรื่อง (แทนที่จะ crash)
  if (!env.AUTH_SECRET) return Response.json({ ok: false, error: "ระบบยังตั้งค่าไม่ครบ (AUTH_SECRET) — แจ้งผู้ดูแล" }, { status: 500 });

  const db = createDb(env.DB);
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !user.passwordHash) return Response.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return Response.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
