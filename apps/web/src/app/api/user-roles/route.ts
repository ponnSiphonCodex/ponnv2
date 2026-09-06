import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRolesForUser, isAdmin } from "@/lib/rbac";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true }); const db = createDatabase(env); const me = await getCurrentUser(env.AUTH_SECRET);
  if (!me) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!isAdmin(await getRolesForUser(db, me.sub))) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }); }
  if (!b.userId || !b.roleId || !["add", "remove"].includes(b.action)) return Response.json({ ok: false, error: "invalid params" }, { status: 400 });
  if (b.action === "add") await db.prepare(`INSERT INTO user_roles(user_id,role_id,created_by,updated_by) VALUES(?,?,?,?) ON CONFLICT(user_id,role_id) DO NOTHING`).bind(b.userId,b.roleId,me.sub,me.sub).run();
  else await db.prepare(`DELETE FROM user_roles WHERE user_id=? AND role_id=?`).bind(b.userId,b.roleId).run();
  return Response.json({ ok: true });
}
