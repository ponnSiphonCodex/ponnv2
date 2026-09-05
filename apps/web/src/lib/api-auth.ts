import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, isGuest } from "./rbac";
import { loadScope, type Scope } from "./access";
export type ApiCtx = { env: CloudflareEnv; d1: D1Database; db: ReturnType<typeof createDb>; me: { sub: string; email: string; name: string | null }; realId: string; impersonating: boolean; admin: boolean; guest: boolean; scope: Scope };
export async function apiContext(): Promise<ApiCtx | null> {
  const { env } = await getCloudflareContext({ async: true });
  const sess = await getCurrentUser(env.AUTH_SECRET);
  if (!sess) return null;
  const db = createDb(env.DB);
  let actingId = sess.sub; let impersonating = false;
  if (sess.imp && sess.imp !== sess.sub) {
    const realRoles = await getRolesForUser(db, sess.sub);
    if (isAdmin(realRoles)) { actingId = sess.imp; impersonating = true; }
  }
  const roles = await getRolesForUser(db, actingId);
  const admin = isAdmin(roles); const guest = isGuest(roles);
  const scope = await loadScope(env.DB, actingId, admin, guest);
  const row = await env.DB.prepare(`SELECT id, email, name FROM users WHERE id = ?`).bind(actingId).first<any>();
  return { env, d1: env.DB, db, me: { sub: row.id, email: row.email, name: row.name }, realId: sess.sub, impersonating, admin, guest, scope };
}
