import { eq } from "drizzle-orm";
import { systemRoles, userRoles } from "@/db";
import type { DbClient } from "@/db";
export type UserRole = { id: number; roleName: string; module: string };
// system role หลัก: System Admin | User | Guest
export async function getRolesForUser(db: DbClient, userId: string): Promise<UserRole[]> {
  return db.select({ id: systemRoles.id, roleName: systemRoles.roleName, module: systemRoles.module })
    .from(userRoles).innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id)).where(eq(userRoles.userId, userId));
}
export function isAdmin(roles: UserRole[]): boolean { return roles.some((r) => r.roleName === "System Admin" || r.module === "GLOBAL"); }
export function isGuest(roles: UserRole[]): boolean { return roles.length === 0 || roles.every((r) => r.roleName === "Guest" || r.module === "GUEST"); }
export function primarySystemRole(roles: UserRole[]): string { if (isAdmin(roles)) return "System Admin"; if (isGuest(roles)) return "Guest"; return "User"; }
