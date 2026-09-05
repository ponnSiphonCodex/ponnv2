/**
 * apps/web/src/lib/rbac.ts
 * อ่าน role ของ user + เช็คว่าเป็น admin ไหม (admin = มี role ชื่อ 'Admin' หรือ module 'GLOBAL')
 */
import { eq } from "drizzle-orm";
import { systemRoles, userRoles } from "@/db";
import type { DbClient } from "@/db";

export type UserRole = { id: number; roleName: string; module: string };

export async function getRolesForUser(db: DbClient, userId: string): Promise<UserRole[]> {
  const rows = await db
    .select({ id: systemRoles.id, roleName: systemRoles.roleName, module: systemRoles.module })
    .from(userRoles)
    .innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id))
    .where(eq(userRoles.userId, userId));
  return rows;
}

export function isAdmin(roles: UserRole[]): boolean {
  return roles.some((r) => r.roleName === "Admin" || r.module === "GLOBAL");
}

export function getModules(roles: UserRole[]): string[] {
  return Array.from(new Set(roles.map((r) => r.module)));
}
