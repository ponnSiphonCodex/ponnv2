import { createDb, type DbClient } from "@/db";
/**
 * rollup.ts — คำนวณ bottom-up สด (task → feature → project)
 * Progress = Done / (Total - Drop) · Budget = SUM(budget_cost) · Actual hrs = SUM(worklogs)
 * Auto dates = MIN(start) / MAX(due)
 */
export type Rollup = {
  total: number; done: number; drop: number; percent: number;
  estimatedHours: number; actualHours: number;
  budgetCost: number;
  minStart: number | null; maxDue: number | null;
};

const EMPTY: Rollup = { total: 0, done: 0, drop: 0, percent: 0, estimatedHours: 0, actualHours: 0, budgetCost: 0, minStart: null, maxDue: null };

function calc(rows: any[]): Rollup {
  let total = 0, done = 0, drop = 0, est = 0, budget = 0, actual = 0;
  let minStart: number | null = null, maxDue: number | null = null;
  for (const r of rows) {
    total++;
    if (r.category === "done") done++;
    else if (r.category === "drop") drop++;
    est += Number(r.estimated_hours) || 0;
    budget += Number(r.budget_cost) || 0;
    actual += Number(r.actual_hours) || 0;
    if (r.start_date != null) minStart = minStart == null ? r.start_date : Math.min(minStart, r.start_date);
    if (r.due_date != null) maxDue = maxDue == null ? r.due_date : Math.max(maxDue, r.due_date);
  }
  const denom = total - drop;
  return { total, done, drop, percent: denom <= 0 ? 0 : Math.round((done / denom) * 1000) / 10, estimatedHours: est, actualHours: actual, budgetCost: budget, minStart, maxDue };
}

async function taskRows(d1: DbClient, where: string, binds: any[]): Promise<any[]> {
  const r = await d1.prepare(
    `SELECT t.estimated_hours, t.budget_cost, t.start_date, t.due_date, ws.category AS category,
            COALESCE((SELECT SUM(w.hours_spent) FROM task_worklogs w WHERE w.task_id=t.id),0) AS actual_hours
     FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE ${where}`
  ).bind(...binds).all();
  return (r.results ?? []) as any[];
}

export async function rollupProject(d1: DbClient, projectId: number): Promise<Rollup> {
  return calc(await taskRows(d1, `t.project_id=? OR t.feature_id IN (SELECT id FROM features WHERE project_id=?)`, [projectId, projectId]));
}
export async function rollupFeature(d1: DbClient, featureId: number): Promise<Rollup> {
  return calc(await taskRows(d1, `t.feature_id=?`, [featureId]));
}
export async function rollupAllFeatures(d1: DbClient, projectId: number): Promise<Record<number, Rollup>> {
  const fr = await d1.prepare(`SELECT id FROM features WHERE project_id=?`).bind(projectId).all();
  const out: Record<number, Rollup> = {};
  for (const f of (fr.results ?? []) as any[]) out[f.id] = await rollupFeature(d1, f.id);
  return out;
}
export { EMPTY as EMPTY_ROLLUP };
