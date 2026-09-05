/**
 * POST /api/user-roles — เพิ่ม/ลบ role ให้ user (admin เท่านั้น)
 * body: { userId, roleId, action: "add" | "remove" }
 */
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, userRoles } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRolesForUser, isAdmin } from "@/lib/rbac";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const me = await getCurrentUser(env.AUTH_SECRET);
  if (!me) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const db = createDb(env.DB);
  const myRoles = await getRolesForUser(db, me.sub);
  if (!isAdmin(myRoles)) return Response.json({ ok: false, error: "forbidden" }, { status: 403 });

  let body: { userId?: string; roleId?: number; action?: string };
  try { body = await req.json(); } catch { return Response.json({ ok: false, error: "bad request" }, { status: 400 }); }
  const { userId, roleId, action } = body;
  if (!userId || !roleId || (action !== "add" && action !== "remove")) return Response.json({ ok: false, error: "invalid params" }, { status: 400 });

  if (action === "add") {
    // INSERT OR IGNORE เทียบเท่า — ใช้ onConflictDoNothing
    await db.insert(userRoles).values({ userId, roleId, createdBy: me.sub, updatedBy: me.sub }).onConflictDoNothing();
  } else {
    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }
  return Response.json({ ok: true });
}
