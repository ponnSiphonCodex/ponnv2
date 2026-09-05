import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { notify, logActivity } from "@/lib/notify";
export const dynamic = "force-dynamic";
const FIELD_MAP: Record<string, { col: string; type: "text"|"num"|"date"|"user" }> = {
  title: { col: "title", type: "text" }, note: { col: "note", type: "text" },
  assigneeId: { col: "assignee_id", type: "user" }, priorityId: { col: "priority_id", type: "num" },
  workflowStatusId: { col: "workflow_status_id", type: "num" }, featureId: { col: "feature_id", type: "num" },
  sprintId: { col: "sprint_id", type: "num" }, estimatedHours: { col: "estimated_hours", type: "num" },
  budgetCost: { col: "budget_cost", type: "num" }, startDate: { col: "start_date", type: "date" }, dueDate: { col: "due_date", type: "date" },
};
function d2u(v: any) { if (!v) return null; const ms = Date.parse(String(v).length === 10 ? v + "T00:00:00Z" : v); return Number.isNaN(ms) ? null : Math.floor(ms/1000); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params; const taskId = Number(id);
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const before = await c.d1.prepare(`SELECT title, assignee_id FROM tasks WHERE id=?`).bind(taskId).first<any>();
  const sets: string[] = []; const vals: any[] = [];
  for (const [k, meta] of Object.entries(FIELD_MAP)) {
    if (!(k in b)) continue;
    let v = b[k];
    if (v === "" || v === undefined) v = null;
    if (meta.type === "num") v = v === null ? null : Number(v);
    if (meta.type === "date") v = d2u(v);
    sets.push(`${meta.col}=?`); vals.push(v);
  }
  if (!sets.length) return Response.json({ ok: true });
  sets.push("updated_by=?", "updated_at=unixepoch()"); vals.push(c.me.sub);
  await c.d1.prepare(`UPDATE tasks SET ${sets.join(", ")} WHERE id=?`).bind(...vals, taskId).run();
  await logActivity(c.d1, { referenceType: "task", referenceId: taskId, userId: c.me.sub, action: "Updated", newValue: Object.keys(b).join(",") });
  // notify ผู้รับมอบหมายใหม่
  if ("assigneeId" in b && b.assigneeId && b.assigneeId !== before?.assignee_id)
    await notify({ d1: c.d1, env: c.env, targetUserId: b.assigneeId, actorId: c.me.sub, actionType: "Assigned", referenceType: "task", referenceId: taskId, message: `คุณได้รับมอบหมายงาน: "${before?.title ?? b.title ?? ""}"` });
  return Response.json({ ok: true });
}
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await ctx.params;
  await c.d1.prepare(`DELETE FROM tasks WHERE id=?`).bind(Number(id)).run();
  await logActivity(c.d1, { referenceType: "task", referenceId: Number(id), userId: c.me.sub, action: "Deleted" });
  return Response.json({ ok: true });
}
