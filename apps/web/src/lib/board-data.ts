import { eq, inArray, sql } from "drizzle-orm";
import { features, projects, tasks, users, workflowStatuses, taskWorklogs, systemRoles, userRoles } from "@/db";
import type { DbClient } from "@/db";

export type BoardTask = { id: number; title: string; assignee: { id: string; name: string | null; image: string | null } | null; estimatedHours: number | null; actualHours: number };
export type BoardColumn = { id: number; name: string; color: string | null; category: "todo" | "doing" | "done"; tasks: BoardTask[] };
export type BoardData = { project: { id: number; name: string; status: string | null; progress: { total: number; done: number; percent: number } }; columns: BoardColumn[] };

export async function getBoardData(db: DbClient, projectId: number): Promise<BoardData | null> {
  const [project] = await db.select({ id: projects.id, name: projects.name, status: projects.status }).from(projects).where(eq(projects.id, projectId));
  if (!project) return null;
  const statuses = await db.select({ id: workflowStatuses.id, name: workflowStatuses.name, color: workflowStatuses.color, category: workflowStatuses.category, sortOrder: workflowStatuses.sortOrder }).from(workflowStatuses).where(eq(workflowStatuses.projectId, projectId)).orderBy(workflowStatuses.sortOrder);
  const taskRows = await db.select({ id: tasks.id, title: tasks.title, workflowStatusId: tasks.workflowStatusId, estimatedHours: tasks.estimatedHours, assigneeId: users.id, assigneeName: users.name, assigneeImage: users.image }).from(tasks).innerJoin(features, eq(tasks.featureId, features.id)).leftJoin(users, eq(tasks.assigneeId, users.id)).where(eq(features.projectId, projectId));
  const taskIds = taskRows.map((t) => t.id);
  const hoursMap = new Map<number, number>();
  if (taskIds.length) {
    const hourRows = await db.select({ taskId: taskWorklogs.taskId, actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number) }).from(taskWorklogs).where(inArray(taskWorklogs.taskId, taskIds)).groupBy(taskWorklogs.taskId);
    for (const r of hourRows) hoursMap.set(r.taskId, r.actualHours);
  }
  const statusCat = new Map(statuses.map((s) => [s.id, s.category]));
  let doneCount = 0;
  for (const t of taskRows) if (statusCat.get(t.workflowStatusId) === "done") doneCount++;
  const total = taskRows.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 1000) / 10;
  const columns: BoardColumn[] = statuses.map((status) => ({
    id: status.id, name: status.name, color: status.color, category: status.category,
    tasks: taskRows.filter((t) => t.workflowStatusId === status.id).map((t) => ({ id: t.id, title: t.title, assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, image: t.assigneeImage } : null, estimatedHours: t.estimatedHours, actualHours: hoursMap.get(t.id) ?? 0 })),
  }));
  return { project: { id: project.id, name: project.name, status: project.status, progress: { total, done: doneCount, percent } }, columns };
}

export async function getUserModules(db: DbClient, userId: string): Promise<string[]> {
  const rows = await db.select({ module: systemRoles.module }).from(userRoles).innerJoin(systemRoles, eq(userRoles.roleId, systemRoles.id)).where(eq(userRoles.userId, userId));
  return Array.from(new Set(rows.map((r) => r.module)));
}
