import type { DbClient } from "@/db";
import type { DbClient } from "@/db";
export type UserRole = { id: number; roleName: string; module: string };
export async function getRolesForUser(db: DbClient, userId: string): Promise<UserRole[]> {
  const r = await db.prepare(`SELECT sr.id, sr.role_name AS "roleName", sr.module FROM user_roles ur JOIN system_roles sr ON ur.role_id=sr.id WHERE ur.user_id=?`).bind(userId).all<UserRole>();
  return r.results ?? [];
}
export function isAdmin(roles: UserRole[]) { return roles.some((r) => r.roleName === "System Admin" || r.module === "GLOBAL"); }
export function isGuest(roles: UserRole[]) { return roles.length === 0 || roles.every((r) => r.roleName === "Guest" || r.module === "GUEST"); }
export function primarySystemRole(roles: UserRole[]) { if (isAdmin(roles)) return "System Admin"; if (isGuest(roles)) return "Guest"; return "User"; }
