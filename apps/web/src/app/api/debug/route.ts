import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const url = new URL(req.url); const cid = env.GOOGLE_CLIENT_ID || "";
  const env_check = { DB_BOUND: typeof env.DB !== "undefined", AUTH_SECRET_SET: Boolean(env.AUTH_SECRET), GOOGLE_CLIENT_ID_SET: Boolean(env.GOOGLE_CLIENT_ID), GOOGLE_CLIENT_SECRET_SET: Boolean(env.GOOGLE_CLIENT_SECRET), TELEGRAM_SET: Boolean(env.TELEGRAM_BOT_TOKEN), ALLOWED_DOMAINS: env.ALLOWED_DOMAINS ?? null, GOOGLE_CLIENT_ID_PREVIEW: cid ? cid.slice(0, 20) + "..." : null, REDIRECT_URI_USED: `${url.origin}/api/auth/callback/google` };
  let db_check: any = { ok: false };
  let schema_check: any = {};
  if (env_check.DB_BOUND) {
    try { const db = createDb(env.DB); const rows = await db.select().from(users).limit(50); db_check = { ok: true, userCount: rows.length }; } catch (e) { db_check = { ok: false, error: e instanceof Error ? e.message : String(e) }; }
    // v28: เช็ค migration ว่าครบไหม (แทนการเดา) — ดูที่นี่แทนรัน SQL เอง
    try {
      const cols = (await env.DB.prepare(`SELECT name FROM pragma_table_info('meetings')`).all()).results?.map((r: any) => r.name) ?? [];
      const need = ["start_time", "organizer", "attendees", "project_name", "project_ids", "product_ids"];
      schema_check.meetings_missing_columns = need.filter((n) => !cols.includes(n));
      const tbls = (await env.DB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('team_roster','team_hidden')`).all()).results?.map((r: any) => r.name) ?? [];
      schema_check.missing_tables = ["team_roster", "team_hidden"].filter((n) => !tbls.includes(n));
      schema_check.migration_complete = schema_check.meetings_missing_columns.length === 0 && schema_check.missing_tables.length === 0;
    } catch (e) { schema_check = { error: e instanceof Error ? e.message : String(e) }; }
  }
  return Response.json({ env: env_check, db: db_check, schema_check });
}
