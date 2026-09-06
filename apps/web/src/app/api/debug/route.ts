import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase } from "@/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true }); const url = new URL(req.url);
  const envCheck = { DATABASE_URL_SET: Boolean(env.DATABASE_URL), AUTH_SECRET_SET: Boolean(env.AUTH_SECRET), GOOGLE_CLIENT_ID_SET: Boolean(env.GOOGLE_CLIENT_ID), GOOGLE_CLIENT_SECRET_SET: Boolean(env.GOOGLE_CLIENT_SECRET), SUPABASE_URL_SET: Boolean(env.NEXT_PUBLIC_SUPABASE_URL), TELEGRAM_SET: Boolean(env.TELEGRAM_BOT_TOKEN), REDIRECT_URI_USED: `${url.origin}/api/auth/callback/google` };
  try { const row = await createDatabase(env).prepare(`SELECT COUNT(*)::int AS count FROM users`).first<any>(); return Response.json({ env: envCheck, db: { ok: true, engine: "Supabase PostgreSQL", userCount: Number(row?.count ?? 0) } }); }
  catch (e) { return Response.json({ env: envCheck, db: { ok: false, error: e instanceof Error ? e.message : String(e) } }); }
}
