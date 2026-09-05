/**
 * apps/web/src/app/api/debug/route.ts
 * Diagnostic endpoint — เปิดใน browser ตรง ๆ (GET /api/debug) เพื่อเช็ค D1 + secrets
 * ⚠️ ลบไฟล์นี้ทิ้งหลัง debug เสร็จ ก่อน production จริงระยะยาว
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";

export async function GET() {
  const { env } = getCloudflareContext();

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
    dbCheck = { ok: false, error: "env.DB ไม่มีค่า — Worker ยังไม่ได้ผูก D1 binding" };
  }

  return Response.json({ env: envCheck, db: dbCheck }, { status: 200 });
}
