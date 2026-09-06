import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";

// ข้อมูลรวมสำหรับ Gantt: tasks + milestones + deps + members ตาม scope
// ?id=all หรือ ?id=<projectId>
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ tasks: [], projects: [], milestones: [], deps: [], members: [] });
  const idParam = new URL(req.url).searchParams.get("id") || "all";
  const scope = await visibleProjectIds(c.d1, c.scope); // null = ทุกโครงการ

  let where = "1=1"; const binds: any[] = [];
  if (idParam !== "all") { where = "pj.id = ?"; binds.push(Number(idParam)); }
  else if (scope) { if (!scope.length) where = "0"; else { where = `pj.id IN (${scope.map(() => "?").join(",")})`; binds.push(...scope); } }

  try {
    const projects = ((await c.d1.prepare(
      `SELECT pj.id, pj.name, pj.product_id, pd.name AS product_name FROM projects pj LEFT JOIN products pd ON pj.product_id=pd.id WHERE ${where} ORDER BY pd.name, pj.name`
    ).bind(...binds).all()).results ?? []) as any[];
    const pjIds = projects.map((p) => p.id);
    if (!pjIds.length) return Response.json({ tasks: [], projects: [], milestones: [], deps: [], members: [] });
    const ph = pjIds.map(() => "?").join(",");

    const tasks = ((await c.d1.prepare(
      `SELECT t.id, t.title, t.start_date AS start, t.due_date AS due, t.project_id,
         pj.name AS project_name, pd.name AS product_name, pj.product_id,
         t.feature_id, f.name AS feature_name,
         t.assignee_id, u.name AS assignee, ws.category AS category, t.estimated_hours
       FROM tasks t
       LEFT JOIN projects pj ON t.project_id=pj.id
       LEFT JOIN products pd ON pj.product_id=pd.id
       LEFT JOIN features f ON t.feature_id=f.id
       LEFT JOIN users u ON t.assignee_id=u.id
       LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id
       WHERE (t.project_id IN (${ph}) OR t.feature_id IN (SELECT id FROM features WHERE project_id IN (${ph})))
         AND t.start_date IS NOT NULL AND t.due_date IS NOT NULL
       ORDER BY t.start_date`
    ).bind(...pjIds, ...pjIds).all()).results ?? []) as any[];

    const milestones = ((await c.d1.prepare(
      `SELECT m.id, m.title, m.target_date AS target, m.project_id, pj.name AS project_name FROM project_milestones m JOIN projects pj ON m.project_id=pj.id WHERE m.project_id IN (${ph}) AND m.target_date IS NOT NULL ORDER BY m.target_date`
    ).bind(...pjIds).all()).results ?? []) as any[];

    const taskIds = tasks.map((t) => t.id);
    let deps: any[] = [];
    if (taskIds.length) { const tph = taskIds.map(() => "?").join(","); deps = ((await c.d1.prepare(`SELECT predecessor_task_id AS pre, successor_task_id AS suc, dependency_type AS type FROM task_dependencies WHERE successor_task_id IN (${tph}) AND predecessor_task_id IN (${tph})`).bind(...taskIds, ...taskIds).all()).results ?? []) as any[]; }

    const memMap = new Map<string, string>();
    for (const t of tasks) if (t.assignee_id) memMap.set(t.assignee_id, t.assignee);
    const pm = ((await c.d1.prepare(`SELECT pm.user_id AS id, u.name FROM project_managers pm JOIN users u ON pm.user_id=u.id WHERE pm.project_id IN (${ph})`).bind(...pjIds).all()).results ?? []) as any[];
    for (const m of pm) memMap.set(m.id, m.name);
    const members = Array.from(memMap.entries()).map(([id, name]) => ({ id, name }));

    return Response.json({ tasks, projects, milestones, deps, members });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e), tasks: [], projects: [], milestones: [], deps: [], members: [] }, { status: 500 });
  }
}
