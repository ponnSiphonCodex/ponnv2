/**
 * รับ callback จาก Google → แลก code เป็น token → profile → upsert → session
 * ★ v18: เก็บ error จริงจาก Google ใส่ query (?error=OAuthSignin&detail=...) เพื่อ debug
 *   redirect_uri ต้องตรงกับ Google Console: <origin>/api/auth/callback/google
 */
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
export const dynamic = "force-dynamic";

function fail(origin: string, code: string, detail?: string) {
  const q = new URLSearchParams({ error: code });
  if (detail) q.set("detail", detail.slice(0, 300));
  return Response.redirect(`${origin}/login?${q.toString()}`, 302);
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const googleErr = url.searchParams.get("error"); // Google อาจส่ง error กลับมาตรงๆ เช่น access_denied
  const redirectUri = `${origin}/api/auth/callback/google`;

  if (googleErr) return fail(origin, "OAuthCallback", `google: ${googleErr}`);
  if (!code) return fail(origin, "OAuthCallback", "no code");

  // 1) แลก code เป็น token — เก็บ response text ถ้า error เพื่อดูสาเหตุจริง
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }).toString(),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => "");
    // body มักมี {"error":"invalid_client"} หรือ {"error":"redirect_uri_mismatch"} ฯลฯ
    return fail(origin, "OAuthSignin", `token ${tokenRes.status}: ${body}`);
  }
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return fail(origin, "OAuthSignin", "no access_token");

  // 2) ดึง profile
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileRes.ok) { const b = await profileRes.text().catch(() => ""); return fail(origin, "OAuthSignin", `userinfo ${profileRes.status}: ${b}`); }
  const profile = (await profileRes.json()) as { id: string; email: string; name?: string; picture?: string };
  if (!profile.email) return fail(origin, "OAuthSignin", "no email in profile");

  // 3) upsert user
  const db = createDb(env.DB);
  let [user] = await db.select().from(users).where(eq(users.email, profile.email));
  if (!user) { const id = crypto.randomUUID(); await db.insert(users).values({ id, email: profile.email, name: profile.name ?? null, image: profile.picture ?? null }); user = { id, email: profile.email, name: profile.name ?? null } as typeof user; }

  // 4) set session
  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = new Response(null, { status: 302, headers: { Location: `${origin}/` } });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
