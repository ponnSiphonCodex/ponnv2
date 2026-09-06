import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase, type Database } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, isGuest } from "./rbac";
import { loadScope, type Scope } from "./access";
export type ApiCtx = { env: CloudflareEnv; d1: Database; db: Database; me: { sub: string; email: string; name: string | null }; realId: string; impersonating: boolean; admin: boolean; guest: boolean; scope: Scope };
export async function apiContext(): Promise<ApiCtx | null> {
  const { env } = await getCloudflareContext({ async: true });
  const sess = await getCurrentUser(env.AUTH_SECRET); if (!sess) return null;
  const db = createDatabase(env);
  let actingId = sess.sub, impersonating = false;
  if (sess.imp && sess.imp !== sess.sub) { const rr = await getRolesForUser(db, sess.sub); if (isAdmin(rr)) { actingId = sess.imp; impersonating = true; } }
  const roles = await getRolesForUser(db, actingId); const admin = isAdmin(roles), guest = isGuest(roles);
  const scope = await loadScope(db as any, actingId, admin, guest);
  const row = await db.prepare(`SELECT id,email,name FROM users WHERE id=?`).bind(actingId).first<any>();
  if (!row) return null;
  return { env, d1: db, db, me: { sub: row.id, email: row.email, name: row.name }, realId: sess.sub, impersonating, admin, guest, scope };
}
