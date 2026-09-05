import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users, systemRoles, userRoles } from "@/db";
import { getCurrentUser } from "@/lib/current-user";
import { getRolesForUser, isAdmin } from "@/lib/rbac";
export const dynamic = "force-dynamic";
export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const me = await getCurrentUser(env.AUTH_SECRET);
  if (!me) return Response.json({ error: "unauthorized" }, { status: 401 });
  const db = createDb(env.DB);
  if (!isAdmin(await getRolesForUser(db, me.sub))) return Response.json({ error: "forbidden" }, { status: 403 });
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).orderBy(users.email);
  const roleRows = await db.select({ userId: userRoles.userId, roleId: systemRoles.id, roleName: systemRoles.roleName, module: systemRoles.module }).from(userRoles).innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id));
  const roleMap = new Map<string, Array<{ roleId: number; roleName: string; module: string }>>();
  for (const r of roleRows) { const l = roleMap.get(r.userId) ?? []; l.push({ roleId: r.roleId, roleName: r.roleName, module: r.module }); roleMap.set(r.userId, l); }
  const allRoles = await db.select({ id: systemRoles.id, roleName: systemRoles.roleName, module: systemRoles.module }).from(systemRoles).orderBy(systemRoles.id);
  return Response.json({ users: allUsers.map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [] })), allRoles });
}
