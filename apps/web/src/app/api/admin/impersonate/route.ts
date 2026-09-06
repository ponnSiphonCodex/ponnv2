import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRolesForUser, isAdmin } from "@/lib/rbac";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
import { logActivity, notifyAdminChat } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const sess = await getCurrentUser(env.AUTH_SECRET); if (!sess) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = createDb(env);
  if (!isAdmin(await getRolesForUser(db, sess.sub))) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { userId?: string | null }; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const imp = b.userId && b.userId !== sess.sub ? b.userId : undefined;
  // AUDIT: บันทึกการสวม/ออกบทบาท (governance)
  if (imp) {
    const target = await createDb(env).prepare(`SELECT email, name FROM users WHERE id=?`).bind(imp).first<any>();
    await logActivity(createDb(env), { referenceType: "impersonation", referenceId: 0, userId: sess.sub, action: "Impersonate_Start", newValue: `${sess.email} → ${target?.email ?? imp}` });
    await notifyAdminChat(env, `⚠️ <b>Impersonation</b>\n${sess.name ?? sess.email} เริ่มสวมบทบาทเป็น ${target?.name ?? target?.email ?? imp}`);
  } else {
    await logActivity(createDb(env), { referenceType: "impersonation", referenceId: 0, userId: sess.sub, action: "Impersonate_End", newValue: sess.email });
  }
  const token = await createSessionToken(env.AUTH_SECRET, { sub: sess.sub, email: sess.email, name: sess.name, imp });
  const res = Response.json({ ok: true, impersonating: !!imp });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
