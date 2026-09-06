import type { DbClient } from "@/db";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, isGuest, primarySystemRole, type UserRole } from "./rbac";
import { loadScope, type Scope } from "./access";

export type SessionUser = { sub: string; email: string; name: string | null; image: string | null; avatarUrl: string | null };
export type PageAuth = {
  db: ReturnType<typeof createDb>; d1: DbClient;
  user: SessionUser;                 // ตัวตนที่ "แสดง/ทำงานเป็น" (อาจถูก impersonate)
  realUser: { sub: string; email: string; name: string | null } | null; // ตัวจริง (admin) ถ้ากำลัง impersonate
  impersonating: boolean;
  roles: UserRole[]; admin: boolean; guest: boolean; systemRole: string; roleLabel: string;
  scope: Scope;
  env: CloudflareEnv;
};

export async function requireAuth(): Promise<PageAuth | null> {
  const { env } = await getCloudflareContext({ async: true });
  const sess = await getCurrentUser(env.AUTH_SECRET);
  if (!sess) return null;
  const db = createDb(env);

  // impersonation: sess.imp = userId ที่ admin เลือกสวมบทบาท
  let actingId = sess.sub;
  let impersonating = false;
  let realUser: { sub: string; email: string; name: string | null } | null = null;
  if (sess.imp && sess.imp !== sess.sub) {
    const realRoles = await getRolesForUser(db, sess.sub);
    if (isAdmin(realRoles)) {
      actingId = sess.imp;
      impersonating = true;
      realUser = { sub: sess.sub, email: sess.email, name: sess.name };
    }
  }

  const row = await createDb(env).prepare(`SELECT id, email, name, image, avatar_url FROM users WHERE id = ?`).bind(actingId).first<any>();
  if (!row) return null;
  const user: SessionUser = { sub: row.id, email: row.email, name: row.name, image: row.image, avatarUrl: row.avatar_url };

  const roles = await getRolesForUser(db, actingId);
  const admin = isAdmin(roles);
  const guest = isGuest(roles);
  const scope = await loadScope(createDb(env), actingId, admin, guest);
  return {
    db, d1: createDb(env), user, realUser, impersonating, roles, admin, guest,
    systemRole: primarySystemRole(roles),
    roleLabel: scope.pmRole ? `${primarySystemRole(roles)} · ${scope.pmRole}` : primarySystemRole(roles),
    scope, env,
  };
}
