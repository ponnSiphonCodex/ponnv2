import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { notify, logActivity } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.title || !b.projectId) return Response.json({ error: "ต้องมี title และ project" }, { status: 400 });
  if (!b.statusId) { const ws=await c.d1.prepare(`SELECT id FROM workflow_statuses ORDER BY position,id LIMIT 1`).first<any>(); b.statusId=ws?.id; }
  if (!b.statusId) return Response.json({ error: "ไม่พบ Workflow Status" }, { status: 400 });
  let featureId = b.featureId ?? null;
  if (!featureId) { const f = await c.d1.prepare(`SELECT id FROM features WHERE project_id=? ORDER BY id LIMIT 1`).bind(b.projectId).first<any>(); featureId = f?.id ?? null; }
  const res = await c.d1.prepare(`INSERT INTO tasks (title, note, project_id, feature_id, workflow_status_id, assignee_id, priority_id, estimated_hours, start_date, due_date, created_by, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(b.title, b.note ?? null, b.projectId, featureId, b.statusId, b.assigneeId ?? null, b.priorityId ?? null, b.estimatedHours ?? null, b.startDate ?? null, b.dueDate ?? null, c.me.sub, c.me.sub).run();
  const id = Number(res.meta?.last_row_id ?? 0);
  await logActivity(c.d1, { referenceType: "task", referenceId: id, userId: c.me.sub, action: "Created", newValue: b.title });
  if (b.assigneeId) await notify({ d1: c.d1, env: c.env, targetUserId: b.assigneeId, actorId: c.me.sub, actionType: "Assigned", referenceType: "task", referenceId: id, message: `คุณได้รับมอบหมายงานใหม่: "${b.title}"` });
  return Response.json({ ok: true, id });
}
