import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { notify, logActivity } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { taskId?: number; statusId?: number; order?: number[] }; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.taskId || !b.statusId) return Response.json({ error: "invalid params" }, { status: 400 });
  try {
    const before = await c.d1.prepare(`SELECT t.title, t.assignee_id, ws.name AS old_status FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE t.id=?`).bind(b.taskId).first<any>();
    const st = await c.d1.prepare(`SELECT name, category FROM workflow_statuses WHERE id=?`).bind(b.statusId).first<any>();
    const completed = st?.category === "done" ? "unixepoch()" : "NULL";
    await c.d1.prepare(`UPDATE tasks SET workflow_status_id=?, completed_datetime=${completed}, updated_by=?, updated_at=unixepoch() WHERE id=?`).bind(b.statusId, c.me.sub, b.taskId).run();
    if (Array.isArray(b.order)) { for (let i = 0; i < b.order.length; i++) await c.d1.prepare(`UPDATE tasks SET sort_order=? WHERE id=?`).bind(i, b.order[i]).run(); }
    await logActivity(c.d1, { referenceType: "task", referenceId: b.taskId, userId: c.me.sub, action: "Status_Changed", fieldChanged: "status", oldValue: before?.old_status ?? null, newValue: st?.name ?? String(b.statusId) });
    if (before?.assignee_id) await notify({ d1: c.d1, env: c.env, targetUserId: before.assignee_id, actorId: c.me.sub, actionType: "Status_Changed", referenceType: "task", referenceId: b.taskId, message: `งาน "${before.title}" เปลี่ยนสถานะเป็น ${st?.name ?? ""}` });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
