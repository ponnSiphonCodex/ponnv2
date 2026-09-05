/**
 * apps/web/src/app/api/auth/google/route.ts
 * เริ่ม Google OAuth 2.0 — redirect ไปหน้า consent ของ Google (เขียน flow เอง ไม่ใช้ NextAuth)
 *
 * ⚠️ redirect_uri = <origin>/api/auth/google/callback
 * ต้องเพิ่ม URL นี้ใน Google Cloud Console → Credentials → Authorized redirect URIs:
 *   https://pm.ponnsth.com/api/auth/google/callback
 */
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
}
