import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users, loginLogs } from "@/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
import { notifyAdminChat } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  let body: { email?: string; password?: string };
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }); }
  const email = body.email?.trim(); const password = body.password;
  if (!email || !password) return Response.json({ ok: false, error: "อีเมลและรหัสผ่านห้ามว่าง" }, { status: 400 });
  if (!env.AUTH_SECRET) return Response.json({ ok: false, error: "ระบบยังตั้งค่าไม่ครบ (AUTH_SECRET)" }, { status: 500 });
  const db = createDb(env.DB);
  const [user] = await db.select().from(users).where(eq(users.email, email));
  const dev = req.headers.get("user-agent")?.slice(0, 180) ?? null;
  const ip = req.headers.get("cf-connecting-ip") ?? null;
  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    await db.insert(loginLogs).values({ userId: user?.id ?? null, email, authProvider: "Local", deviceInfo: dev, ipAddress: ip, success: 0 });
    return Response.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  if (!user.active) return Response.json({ ok: false, error: "บัญชีถูกปิดใช้งาน ติดต่อผู้ดูแล" }, { status: 403 });
  await db.insert(loginLogs).values({ userId: user.id, email, authProvider: "Local", deviceInfo: dev, ipAddress: ip, success: 1 });
  await env.DB.prepare(`UPDATE users SET last_login_at = unixepoch() WHERE id = ?`).bind(user.id).run();
  const when = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16) + " น.";
  await notifyAdminChat(env, `🔑 <b>เข้าสู่ระบบ</b>\n${user.name ?? user.email} (Local)\n${when}`);
  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = Response.json({ ok: true });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
