import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users, userRoles, systemRoles, loginLogs } from "@/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
export const dynamic = "force-dynamic";
function fail(origin: string, err: string, detail?: string) { const q = new URLSearchParams({ error: err }); if (detail) q.set("detail", detail.slice(0, 300)); return Response.redirect(`${origin}/login?${q.toString()}`, 302); }
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url); const origin = url.origin;
  const code = url.searchParams.get("code"); const gerr = url.searchParams.get("error");
  const redirectUri = `${origin}/api/auth/callback/google`;
  if (gerr) return fail(origin, "OAuthCallback", `google: ${gerr}`);
  if (!code) return fail(origin, "OAuthCallback", "no code");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }).toString() });
  if (!tokenRes.ok) { const b = await tokenRes.text().catch(() => ""); return fail(origin, "OAuthSignin", `token ${tokenRes.status}: ${b}`); }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return fail(origin, "OAuthSignin", "no access_token");
  const pr = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!pr.ok) { const b = await pr.text().catch(() => ""); return fail(origin, "OAuthSignin", `userinfo ${pr.status}: ${b}`); }
  const profile = (await pr.json()) as { id: string; email: string; name?: string; picture?: string };
  if (!profile.email) return fail(origin, "OAuthSignin", "no email in profile");
  const allowed = (env.ALLOWED_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  const domain = profile.email.split("@")[1]?.toLowerCase() ?? "";
  if (allowed.length && !allowed.includes(domain)) return fail(origin, "OAuthSignin", `domain "${domain}" ไม่ได้รับอนุญาต`);
  const db = createDb(env.DB);
  let [user] = await db.select().from(users).where(eq(users.email, profile.email));
  const isNew = !user;
  if (!user) { const id = crypto.randomUUID(); await db.insert(users).values({ id, email: profile.email, name: profile.name ?? null, image: profile.picture ?? null }); user = { id, email: profile.email, name: profile.name ?? null } as typeof user; }
  else if (profile.picture) { await env.DB.prepare(`UPDATE users SET image = ? WHERE id = ?`).bind(profile.picture, user.id).run(); }
  if (!user.active && !isNew) return fail(origin, "OAuthSignin", "บัญชีถูกปิดใช้งาน");
  // user ใหม่ = Guest (role 3) รอ admin เพิ่มสิทธิ์
  if (isNew) { const [g] = await db.select().from(systemRoles).where(eq(systemRoles.roleName, "Guest")); if (g) await db.insert(userRoles).values({ userId: user.id, roleId: g.id }).onConflictDoNothing(); }
  await db.insert(loginLogs).values({ userId: user.id, email: user.email, authProvider: "Google", deviceInfo: req.headers.get("user-agent")?.slice(0, 180) ?? null, ipAddress: req.headers.get("cf-connecting-ip") ?? null, success: 1 });
  await env.DB.prepare(`UPDATE users SET last_login_at = unixepoch() WHERE id = ?`).bind(user.id).run();
  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = new Response(null, { status: 302, headers: { Location: `${origin}/` } });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
