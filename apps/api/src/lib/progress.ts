import { eq, inArray, sql } from "drizzle-orm";
import { features, tasks, taskWorklogs, workflowStatuses } from "../db";
import type { DbClient } from "../db";
export type ProgressResult = { total: number; done: number; percent: number };
export type AutoDates = { startDate: Date | null; dueDate: Date | null };
function epochToDate(e: number | null): Date | null { return e ? new Date(e * 1000) : null; }
export async function computeProjectProgress(db: DbClient, projectId: number): Promise<ProgressResult> {
  const [row] = await db.select({ total: sql<number>`count(*)`.mapWith(Number), done: sql<number>`sum(case when ${workflowStatuses.category} = 'done' then 1 else 0 end)`.mapWith(Number) })
    .from(tasks).innerJoin(features, eq(tasks.featureId, features.id)).innerJoin(workflowStatuses, eq(tasks.workflowStatusId, workflowStatuses.id)).where(eq(features.projectId, projectId));
  const total = row?.total ?? 0; const done = row?.done ?? 0;
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 1000) / 10 };
}
export async function computeProjectAutoDates(db: DbClient, projectId: number): Promise<AutoDates> {
  const [row] = await db.select({ startDate: sql<number | null>`min(${tasks.startDate})`.mapWith(Number), dueDate: sql<number | null>`max(${tasks.dueDate})`.mapWith(Number) })
    .from(tasks).innerJoin(features, eq(tasks.featureId, features.id)).where(eq(features.projectId, projectId));
  return { startDate: epochToDate(row?.startDate ?? null), dueDate: epochToDate(row?.dueDate ?? null) };
}
export async function computeTaskActualHours(db: DbClient, taskId: number): Promise<number> {
  const [row] = await db.select({ actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number) }).from(taskWorklogs).where(eq(taskWorklogs.taskId, taskId));
  return row?.actualHours ?? 0;
}
export async function computeActualHoursForTasks(db: DbClient, taskIds: number[]): Promise<Map<number, number>> {
  if (taskIds.length === 0) return new Map();
  const rows = await db.select({ taskId: taskWorklogs.taskId, actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number) }).from(taskWorklogs).where(inArray(taskWorklogs.taskId, taskIds)).groupBy(taskWorklogs.taskId);
  return new Map(rows.map((r) => [r.taskId, r.actualHours]));
}
