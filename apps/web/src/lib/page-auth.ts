/**
 * apps/web/src/lib/page-auth.ts
 * Helper สำหรับหน้า server component: เช็ค session + โหลด roles ในทีเดียว
 * คืน null ถ้าไม่ login (ให้ page เรียก redirect เอง)
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, type UserRole } from "./rbac";

export type PageAuth = {
  db: ReturnType<typeof createDb>;
  user: { sub: string; email: string; name: string | null };
  roles: UserRole[];
  admin: boolean;
  roleLabel: string;
};

export async function requireAuth(): Promise<PageAuth | null> {
  const { env } = await getCloudflareContext({ async: true });
  const user = await getCurrentUser(env.AUTH_SECRET);
  if (!user) return null;
  const db = createDb(env.DB);
  const roles = await getRolesForUser(db, user.sub);
  const admin = isAdmin(roles);
  const roleLabel = roles.length ? roles.map((r) => r.roleName).join(", ") : "ยังไม่กำหนดสิทธิ์";
  return { db, user, roles, admin, roleLabel };
}
