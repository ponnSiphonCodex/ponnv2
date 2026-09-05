import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRolesForUser, isAdmin } from "@/lib/rbac";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const sess = await getCurrentUser(env.AUTH_SECRET); if (!sess) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = createDb(env.DB);
  const realRoles = await getRolesForUser(db, sess.sub);
  if (!isAdmin(realRoles)) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { userId?: string | null }; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  // ออกจากโหมดสวมบทบาท ถ้า userId ว่าง/null หรือ = ตัวเอง
  const imp = b.userId && b.userId !== sess.sub ? b.userId : undefined;
  const token = await createSessionToken(env.AUTH_SECRET, { sub: sess.sub, email: sess.email, name: sess.name, imp });
  const res = Response.json({ ok: true, impersonating: !!imp });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
