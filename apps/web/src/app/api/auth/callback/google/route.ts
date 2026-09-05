import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  if (!code) return Response.redirect(`${url.origin}/login?error=OAuthCallback`, 302);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirectUri, grant_type: "authorization_code" }).toString() });
  if (!tokenRes.ok) return Response.redirect(`${url.origin}/login?error=OAuthSignin`, 302);
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return Response.redirect(`${url.origin}/login?error=OAuthSignin`, 302);
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profileRes.ok) return Response.redirect(`${url.origin}/login?error=OAuthSignin`, 302);
  const profile = (await profileRes.json()) as { id: string; email: string; name?: string; picture?: string };
  if (!profile.email) return Response.redirect(`${url.origin}/login?error=OAuthSignin`, 302);
  const db = createDb(env.DB);
  let [user] = await db.select().from(users).where(eq(users.email, profile.email));
  if (!user) { const id = crypto.randomUUID(); await db.insert(users).values({ id, email: profile.email, name: profile.name ?? null, image: profile.picture ?? null }); user = { id, email: profile.email, name: profile.name ?? null } as typeof user; }
  const token = await createSessionToken(env.AUTH_SECRET, { sub: user.id, email: user.email, name: user.name });
  const res = new Response(null, { status: 302, headers: { Location: `${url.origin}/` } });
  res.headers.append("Set-Cookie", buildSessionCookie(token));
  return res;
}
