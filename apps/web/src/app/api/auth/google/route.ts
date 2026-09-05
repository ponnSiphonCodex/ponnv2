import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/callback/google`;
  if (!env.GOOGLE_CLIENT_ID) return Response.redirect(`${url.origin}/login?error=NoClientId`, 302);
  const params = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", access_type: "online", prompt: "select_account" });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
}
