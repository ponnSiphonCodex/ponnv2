import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: { taskId?: number; statusId?: number; order?: number[] }; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.taskId || !b.statusId) return Response.json({ error: "invalid params" }, { status: 400 });
  const cat = await c.d1.prepare(`SELECT category FROM workflow_statuses WHERE id = ?`).bind(b.statusId).first<any>();
  const completed = cat?.category === "done" ? "unixepoch()" : "NULL";
  await c.d1.prepare(`UPDATE tasks SET workflow_status_id=?, completed_datetime=${completed}, updated_by=?, updated_at=unixepoch() WHERE id=?`).bind(b.statusId, c.me.sub, b.taskId).run();
  if (Array.isArray(b.order)) { for (let i = 0; i < b.order.length; i++) await c.d1.prepare(`UPDATE tasks SET sort_order=? WHERE id=?`).bind(i, b.order[i]).run(); }
  await c.d1.prepare(`INSERT INTO activity_logs (reference_type, reference_id, user_id, action, field_changed, new_value) VALUES ('task',?,?,'Status_Changed','workflow_status_id',?)`).bind(b.taskId, c.me.sub, String(b.statusId)).run();
  return Response.json({ ok: true });
}
