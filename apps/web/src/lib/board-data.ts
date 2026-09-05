export type BoardTask = { id: number; title: string; workflowStatusId: number | null; sortOrder: number; assignee: { id: string; name: string | null } | null; priority: { name: string; color: string | null } | null; estimatedHours: number | null; actualHours: number; dueDate: number | null };
export type BoardColumn = { id: number; name: string; color: string | null; category: string; tasks: BoardTask[] };
export type Progress = { total: number; done: number; drop: number; percent: number };
export type BoardData = { project: { id: number; name: string; status: string | null; progress: Progress }; columns: BoardColumn[] };
export async function getBoardData(db: D1Database, projectId: number): Promise<BoardData | null> {
  const proj = await db.prepare(`SELECT id, name, status FROM projects WHERE id = ?`).bind(projectId).first<any>();
  if (!proj) return null;
  const st = await db.prepare(`SELECT id, name, color, category, sort_order FROM workflow_statuses WHERE project_id = ? ORDER BY sort_order`).bind(projectId).all();
  const statuses = (st.results ?? []) as any[];
  // single query: LEFT JOIN aggregate worklogs (แทน correlated subquery ต่อแถว → เร็วขึ้นมาก)
  const tk = await db.prepare(
    `SELECT t.id, t.title, t.workflow_status_id, t.estimated_hours, t.due_date, t.sort_order, t.assignee_id, u.name AS assignee_name, p.name AS priority_name, p.color AS priority_color,
     COALESCE(wl.actual_hours, 0) AS actual_hours
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id=u.id
     LEFT JOIN priorities p ON t.priority_id=p.id
     LEFT JOIN (SELECT task_id, SUM(hours_spent) AS actual_hours FROM task_worklogs GROUP BY task_id) wl ON wl.task_id = t.id
     WHERE t.project_id = ? OR t.feature_id IN (SELECT id FROM features WHERE project_id = ?) ORDER BY t.sort_order, t.id`
  ).bind(projectId, projectId).all();
  const rows = (tk.results ?? []) as any[];
  const cat = new Map(statuses.map((s) => [s.id, s.category]));
  let done = 0, drop = 0;
  for (const t of rows) { const c = cat.get(t.workflow_status_id); if (c === "done") done++; else if (c === "drop") drop++; }
  const total = rows.length; const denom = total - drop;
  const percent = denom <= 0 ? 0 : Math.round((done / denom) * 1000) / 10;
  const columns: BoardColumn[] = statuses.map((s) => ({ id: s.id, name: s.name, color: s.color, category: s.category, tasks: rows.filter((t) => t.workflow_status_id === s.id).map((t) => ({ id: t.id, title: t.title, workflowStatusId: t.workflow_status_id, sortOrder: t.sort_order, assignee: t.assignee_id ? { id: t.assignee_id, name: t.assignee_name } : null, priority: t.priority_name ? { name: t.priority_name, color: t.priority_color } : null, estimatedHours: t.estimated_hours, actualHours: Number(t.actual_hours) || 0, dueDate: t.due_date })) }));
  return { project: { id: proj.id, name: proj.name, status: proj.status, progress: { total, done, drop, percent } }, columns };
}
export async function listProjects(db: D1Database, ids?: number[] | null): Promise<{ id: number; name: string; status: string | null }[]> {
  let sql = `SELECT id, name, status FROM projects`; const binds: any[] = [];
  if (ids && ids.length >= 0) { if (ids.length === 0) return []; sql += ` WHERE id IN (${ids.map(() => "?").join(",")})`; binds.push(...ids); }
  sql += ` ORDER BY id`;
  const r = await db.prepare(sql).bind(...binds).all(); return (r.results ?? []) as any;
}
export type GanttRow = { id: number; title: string; start: number | null; due: number | null; category: string | null; assignee: string | null };
export async function getGanttRows(db: D1Database, projectId: number): Promise<GanttRow[]> {
  const tk = await db.prepare(`SELECT t.id, t.title, t.start_date AS start, t.due_date AS due, ws.category AS category, u.name AS assignee FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id LEFT JOIN users u ON t.assignee_id=u.id WHERE (t.project_id=? OR t.feature_id IN (SELECT id FROM features WHERE project_id=?)) AND t.start_date IS NOT NULL AND t.due_date IS NOT NULL ORDER BY t.start_date`).bind(projectId, projectId).all();
  return (tk.results ?? []) as any;
}
export async function dashboardStats(db: D1Database, ids?: number[] | null) {
  const scopeCond = ids && ids.length >= 0 ? (ids.length ? ` WHERE project_id IN (${ids.map(()=>"?").join(",")})` : ` WHERE 0`) : "";
  const one = async (sql: string, b: any[] = []) => Number((await db.prepare(sql).bind(...b).first<any>())?.c ?? 0);
  const pid = ids && ids.length ? ids : [];
  return {
    projects: ids && ids.length >= 0 ? (ids.length ? await one(`SELECT COUNT(*) c FROM projects WHERE id IN (${ids.map(()=>"?").join(",")})`, ids) : 0) : await one(`SELECT COUNT(*) c FROM projects`),
    active: ids && ids.length >= 0 ? (ids.length ? await one(`SELECT COUNT(*) c FROM projects WHERE status='In Progress' AND id IN (${ids.map(()=>"?").join(",")})`, ids) : 0) : await one(`SELECT COUNT(*) c FROM projects WHERE status='In Progress'`),
    openIssues: await one(`SELECT COUNT(*) c FROM issues WHERE status != 'Closed'`),
    risks: await one(`SELECT COUNT(*) c FROM risks WHERE status != 'Closed'`),
  };
}

export async function getMilestones(db: D1Database, projectId: number): Promise<{ id: number; title: string; target_date: number | null; status: string | null }[]> {
  const r = await db.prepare(`SELECT id, title, target_date, status FROM project_milestones WHERE project_id=? AND target_date IS NOT NULL ORDER BY target_date`).bind(projectId).all();
  return (r.results ?? []) as any;
}
export async function statusBreakdown(db: D1Database, ids?: number[] | null): Promise<{ category: string; c: number }[]> {
  let sql = `SELECT ws.category AS category, COUNT(*) AS c FROM tasks t JOIN workflow_statuses ws ON t.workflow_status_id=ws.id`;
  const binds: any[] = [];
  if (ids && ids.length >= 0) { if (ids.length === 0) return []; sql += ` WHERE t.project_id IN (${ids.map(()=>"?").join(",")})`; binds.push(...ids); }
  sql += ` GROUP BY ws.category`;
  const r = await db.prepare(sql).bind(...binds).all(); return (r.results ?? []) as any;
}
export async function workloadByUser(db: D1Database, ids?: number[] | null): Promise<{ name: string; c: number }[]> {
  let sql = `SELECT COALESCE(u.name,u.email,'ยังไม่มอบหมาย') AS name, COUNT(*) AS c FROM tasks t LEFT JOIN users u ON t.assignee_id=u.id LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE (ws.category IS NULL OR ws.category NOT IN ('done','drop'))`;
  const binds: any[] = [];
  if (ids && ids.length >= 0) { if (ids.length === 0) return []; sql += ` AND t.project_id IN (${ids.map(()=>"?").join(",")})`; binds.push(...ids); }
  sql += ` GROUP BY u.id ORDER BY c DESC LIMIT 8`;
  const r = await db.prepare(sql).bind(...binds).all(); return (r.results ?? []) as any;
}
