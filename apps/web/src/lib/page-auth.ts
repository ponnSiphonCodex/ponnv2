import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, type UserRole } from "./rbac";
export type PageAuth = { db: ReturnType<typeof createDb>; user: { sub: string; email: string; name: string | null }; roles: UserRole[]; admin: boolean; roleLabel: string };
export async function requireAuth(): Promise<PageAuth | null> {
  const { env } = await getCloudflareContext({ async: true });
  const user = await getCurrentUser(env.AUTH_SECRET);
  if (!user) return null;
  const db = createDb(env.DB);
  const roles = await getRolesForUser(db, user.sub);
  return { db, user, roles, admin: isAdmin(roles), roleLabel: roles.length ? roles.map((r) => r.roleName).join(", ") : "ยังไม่กำหนดสิทธิ์" };
}
