import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import { customFields, customFieldValues, features, projects, tasks, themes, users, workflowStatuses, createDb } from "../db";
import type { AppEnv } from "../types";
import { computeActualHoursForTasks, computeProjectAutoDates, computeProjectProgress } from "../lib/progress";
export const boardRoutes = new Hono<AppEnv>();
boardRoutes.get("/:projectId/board", async (c) => {
  const projectId = Number(c.req.param("projectId"));
  if (!Number.isInteger(projectId)) return c.json({ error: "projectId ต้องเป็นตัวเลข" }, 400);
  const db = createDb(c.env.DB);
  const [project] = await db.select({ id: projects.id, name: projects.name, status: projects.status, themeId: projects.themeId, themeName: themes.name }).from(projects).leftJoin(themes, eq(projects.themeId, themes.id)).where(eq(projects.id, projectId));
  if (!project) return c.json({ error: "ไม่พบ Project นี้" }, 404);
  const statuses = await db.select({ id: workflowStatuses.id, name: workflowStatuses.name, color: workflowStatuses.color, category: workflowStatuses.category, sortOrder: workflowStatuses.sortOrder }).from(workflowStatuses).where(eq(workflowStatuses.projectId, projectId)).orderBy(workflowStatuses.sortOrder);
  const taskRows = await db.select({ id: tasks.id, title: tasks.title, workflowStatusId: tasks.workflowStatusId, startDate: tasks.startDate, dueDate: tasks.dueDate, estimatedHours: tasks.estimatedHours, budgetCost: tasks.budgetCost, featureId: tasks.featureId, assigneeId: users.id, assigneeName: users.name, assigneeImage: users.image }).from(tasks).innerJoin(features, eq(tasks.featureId, features.id)).leftJoin(users, eq(tasks.assigneeId, users.id)).where(eq(features.projectId, projectId));
  const taskIds = taskRows.map((t) => t.id);
  const customFieldRows = taskIds.length ? await db.select({ entityId: customFieldValues.entityId, fieldId: customFields.id, fieldName: customFields.fieldName, fieldType: customFields.fieldType, value: customFieldValues.value }).from(customFieldValues).innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id)).where(and(inArray(customFieldValues.entityId, taskIds), eq(customFields.entityType, "task"))) : [];
  const cfMap = new Map<number, Array<{ fieldId: number; fieldName: string; fieldType: string; value: string | null }>>();
  for (const row of customFieldRows) { const list = cfMap.get(row.entityId) ?? []; list.push({ fieldId: row.fieldId, fieldName: row.fieldName, fieldType: row.fieldType, value: row.value }); cfMap.set(row.entityId, list); }
  const actualHoursMap = await computeActualHoursForTasks(db, taskIds);
  const [progress, autoDates] = await Promise.all([computeProjectProgress(db, projectId), computeProjectAutoDates(db, projectId)]);
  const columns = statuses.map((status) => ({ id: status.id, name: status.name, color: status.color, category: status.category, sortOrder: status.sortOrder, tasks: taskRows.filter((t) => t.workflowStatusId === status.id).map((t) => ({ id: t.id, title: t.title, featureId: t.featureId, assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, image: t.assigneeImage } : null, startDate: t.startDate, dueDate: t.dueDate, estimatedHours: t.estimatedHours, actualHours: actualHoursMap.get(t.id) ?? 0, budgetCost: t.budgetCost, customFields: cfMap.get(t.id) ?? [] })) }));
  return c.json({ project: { id: project.id, name: project.name, status: project.status, theme: project.themeId ? { id: project.themeId, name: project.themeName } : null, autoDates, progress }, columns });
});
