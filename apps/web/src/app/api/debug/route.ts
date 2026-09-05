/**
 * apps/web/src/app/api/debug/route.ts
 *
 * Diagnostic endpoint — เปิดใน browser ตรง ๆ (GET /api/debug) เพื่อเช็คว่า:
 *   1. D1 binding (env.DB) ถูกผูกจริงไหม + query ได้จริงไหม
 *   2. Secrets ที่จำเป็น (AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) ถูกตั้งไว้ครบไหม
 *      (บอกแค่ true/false ว่ามีค่าไหม ไม่เปิดเผยค่าจริงของ secret)
 *
 * ⚠️ ควรลบไฟล์นี้ทิ้ง (หรือใส่ auth guard) หลัง debug เสร็จ ก่อน production จริงระยะยาว
 * เพราะบอกข้อมูล infrastructure (แม้ไม่ใช่ secret values ตรง ๆ) แก่ใครก็ตามที่เปิด URL นี้ได้
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";

export async function GET() {
  const { env } = getCloudflareContext<{
    DB: D1Database;
    AUTH_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  }>();

  const envCheck = {
    DB_BOUND: typeof env.DB !== "undefined",
    AUTH_SECRET_SET: Boolean(env.AUTH_SECRET),
    GOOGLE_CLIENT_ID_SET: Boolean(env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET_SET: Boolean(env.GOOGLE_CLIENT_SECRET),
  };

  let dbCheck: { ok: boolean; error?: string; userCount?: number } = { ok: false };

  if (envCheck.DB_BOUND) {
    try {
      const db = createDb(env.DB);
      const rows = await db.select().from(users).limit(5);
      dbCheck = { ok: true, userCount: rows.length };
    } catch (err) {
      dbCheck = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  } else {
    dbCheck = { ok: false, error: "env.DB ไม่มีค่า — Worker ยังไม่ได้ผูก D1 binding (เช็ค wrangler.jsonc + Cloudflare Dashboard > Settings > Bindings)" };
  }

  return Response.json({ env: envCheck, db: dbCheck }, { status: 200 });
}
