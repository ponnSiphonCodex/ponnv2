import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
import { notifyAdminChat } from "@/lib/notify";
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
  const db = createDb(env);
  let user = await db.prepare(`SELECT * FROM users WHERE email=?`).bind(profile.email).first<any>();
  const isNew = !user;
  if (!user) { const id=crypto.randomUUID(); await db.prepare(`INSERT INTO users(id,email,name,image) VALUES(?,?,?,?)`).bind(id,profile.email,profile.name??null,profile.picture??null).run(); user={id,email:profile.email,name:profile.name??null,active:1}; }
  else if (profile.picture) await db.prepare(`UPDATE users SET image=? WHERE id=?`).bind(profile.picture,user.id).run();
  if (!user.active && !isNew) return fail(origin,"OAuthSignin","บัญชีถูกปิดใช้งาน");
  if (isNew) { const g=await db.prepare(`SELECT id FROM system_roles WHERE role_name='Guest' LIMIT 1`).first<any>(); if(g) await db.prepare(`INSERT OR IGNORE INTO user_roles(user_id,role_id) VALUES(?,?)`).bind(user.id,g.id).run(); }
  await db.prepare(`INSERT INTO login_logs(user_id,email,auth_provider,device_info,ip_address,success) VALUES(?,?,?,?,?,1)`).bind(user.id,user.email,"Google",req.headers.get("user-agent")?.slice(0,180)??null,req.headers.get("cf-connecting-ip")??null).run();
  await db.prepare(`UPDATE users SET last_login_at=unixepoch() WHERE id=?`).bind(user.id).run();
  const when = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16) + " น.";
  if (isNew) await notifyAdminChat(env, `🆕 <b>ผู้ใช้ใหม่เข้าระบบ</b>\n${profile.name ?? profile.email}\n${profile.email}\nGoogle · ${when}\n→ รอเปิดสิทธิ์ที่เมนู จัดการผู้ใช้งาน`);
  else await notifyAdminChat(env, `🔑 <b>เข้าสู่ระบบ</b>\n${user.name ?? user.email} (Google)\n${when}`);
  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = new Response(null, { status: 302, headers: { Location: `${origin}/` } });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
