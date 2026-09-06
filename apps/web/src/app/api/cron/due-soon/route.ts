import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notify } from "@/lib/notify";
export const dynamic = "force-dynamic";
// เรียกโดย Cloudflare Cron Trigger (ตั้ง secret CRON_SECRET แล้วส่ง ?key=)
// ตัวอย่าง cron worker: fetch("https://pm.ponnsth.com/api/cron/due-soon?key=SECRET")
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const key = new URL(req.url).searchParams.get("key");
  const expected = (env as any).CRON_SECRET;
  if (expected && key !== expected) return Response.json({ error: "forbidden" }, { status: 403 });
  const now = Math.floor(Date.now() / 1000);
  const in48 = now + 48 * 3600;
  // งานที่ยังไม่เสร็จ + due ภายใน 48 ชม.
  const r = await createDb(env).prepare(
    `SELECT t.id, t.title, t.assignee_id, t.due_date FROM tasks t
     LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id
     WHERE t.due_date IS NOT NULL AND t.due_date BETWEEN ? AND ? AND t.assignee_id IS NOT NULL
       AND (ws.category IS NULL OR ws.category NOT IN ('done','drop'))`
  ).bind(now, in48).all();
  const rows = (r.results ?? []) as any[];
  let sent = 0;
  for (const t of rows) {
    const hrs = Math.round((t.due_date - now) / 3600);
    await notify({ d1: createDb(env), env, targetUserId: t.assignee_id, actorId: null, actionType: "Due_Soon", referenceType: "task", referenceId: t.id, message: `⏰ งาน "${t.title}" ครบกำหนดในอีก ~${hrs} ชม.` });
    sent++;
  }
  return Response.json({ ok: true, checked: rows.length, notified: sent });
}
