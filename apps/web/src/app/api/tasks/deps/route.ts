import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
// GET ?taskId= : list deps + candidate tasks in same project
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const taskId = Number(new URL(req.url).searchParams.get("taskId"));
  if (!taskId) return Response.json({ error: "no taskId" }, { status: 400 });
  const t = await c.d1.prepare(`SELECT project_id FROM tasks WHERE id=?`).bind(taskId).first<any>();
  const deps = (await c.d1.prepare(`SELECT d.id, d.dependency_type, d.predecessor_task_id, t.title AS predecessor_title FROM task_dependencies d JOIN tasks t ON d.predecessor_task_id=t.id WHERE d.successor_task_id=?`).bind(taskId).all()).results ?? [];
  const candidates = (await c.d1.prepare(`SELECT id, title FROM tasks WHERE project_id=? AND id!=? ORDER BY id`).bind(t?.project_id ?? -1, taskId).all()).results ?? [];
  return Response.json({ deps, candidates });
}
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.successorTaskId || !b.predecessorTaskId) return Response.json({ error: "invalid" }, { status: 400 });
  if (b.successorTaskId === b.predecessorTaskId) return Response.json({ error: "งานขึ้นกับตัวเองไม่ได้" }, { status: 400 });
  await c.d1.prepare(`INSERT INTO task_dependencies (predecessor_task_id, successor_task_id, dependency_type, created_by, updated_by) VALUES (?,?,?,?,?)`).bind(b.predecessorTaskId, b.successorTaskId, b.dependencyType ?? "FS", c.me.sub, c.me.sub).run();
  return Response.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await c.d1.prepare(`DELETE FROM task_dependencies WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
