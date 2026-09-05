/**
 * apps/web/src/app/api/auth/google/route.ts
 * เริ่ม Google OAuth 2.0 — redirect ไปหน้า consent ของ Google
 *
 * ⚠️ redirect_uri = <origin>/api/auth/callback/google (ตรงกับ Google Console ที่ตั้งไว้แล้ว)
 * ⚠️ ถ้าเจอ "invalid_client / OAuth client was not found" = GOOGLE_CLIENT_ID secret ยังไม่ได้
 *    ตั้งใน Cloudflare (ส่ง client_id ว่าง) → ไปตั้งที่ Worker > Settings > Variables and Secrets
 */
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/callback/google`;

  // ถ้ายังไม่ได้ตั้ง GOOGLE_CLIENT_ID จะเด้งกลับ login พร้อม error ที่อ่านรู้เรื่อง
  // (แทนที่จะไปเจอหน้า invalid_client ของ Google ที่งง)
  if (!env.GOOGLE_CLIENT_ID) {
    return Response.redirect(`${url.origin}/login?error=NoClientId`, 302);
  }

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
