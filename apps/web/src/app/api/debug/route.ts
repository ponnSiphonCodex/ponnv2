import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url);
  const cid = env.GOOGLE_CLIENT_ID || "";
  const env_check = {
    DB_BOUND: typeof env.DB !== "undefined",
    AUTH_SECRET_SET: Boolean(env.AUTH_SECRET),
    GOOGLE_CLIENT_ID_SET: Boolean(env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET_SET: Boolean(env.GOOGLE_CLIENT_SECRET),
    // ช่วย debug google: โชว์ client_id 20 ตัวแรก + redirect_uri ที่โค้ดใช้จริง
    GOOGLE_CLIENT_ID_PREVIEW: cid ? cid.slice(0, 20) + "..." : null,
    REDIRECT_URI_USED: `${url.origin}/api/auth/callback/google`,
  };
  let db_check: { ok: boolean; error?: string; userCount?: number } = { ok: false };
  if (env_check.DB_BOUND) { try { const db = createDb(env.DB); const rows = await db.select().from(users).limit(50); db_check = { ok: true, userCount: rows.length }; } catch (e) { db_check = { ok: false, error: e instanceof Error ? e.message : String(e) }; } } else { db_check = { ok: false, error: "no DB" }; }
  return Response.json({ env: env_check, db: db_check }, { status: 200 });
}
