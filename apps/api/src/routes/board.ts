/**
 * apps/api/src/routes/board.ts
 *
 * GET /api/projects/:projectId/board
 * ดึงข้อมูล Project Board แบบ Kanban ครบชุด: คอลัมน์ (Workflow Status) → Task → Custom Fields
 * พร้อม Progress % และ Actual Hours (real-time จาก worklogs)
 *
 * Response shape:
 * {
 *   project: { id, name, status, theme, autoDates: {startDate, dueDate}, progress: {total, done, percent} },
 *   columns: [
 *     {
 *       id, name, color, category, sortOrder,
 *       tasks: [{
 *         id, title, assignee, startDate, dueDate, estimatedHours, actualHours, budgetCost,
 *         customFields: [{ fieldId, fieldName, fieldType, value }]
 *       }]
 *     }
 *   ]
 * }
 */
import { Hono } from "hono";
import { and, eq, inArray } from "drizzle-orm";
import {
  customFields,
  customFieldValues,
  features,
  projects,
  tasks,
  themes,
  users,
  workflowStatuses,
} from "@pm-platform/db";
import { createDb } from "@pm-platform/db";
import type { AppEnv } from "../types";
import { computeActualHoursForTasks, computeProjectAutoDates, computeProjectProgress } from "../lib/progress";

export const boardRoutes = new Hono<AppEnv>();

boardRoutes.get("/:projectId/board", async (c) => {
  const projectId = Number(c.req.param("projectId"));
  if (!Number.isInteger(projectId)) {
    return c.json({ error: "projectId ต้องเป็นตัวเลข" }, 400);
  }

  const db = createDb(c.env.DB);

  // 1) Project + Theme
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      themeId: projects.themeId,
      themeName: themes.name,
    })
    .from(projects)
    .leftJoin(themes, eq(projects.themeId, themes.id))
    .where(eq(projects.id, projectId));

  if (!project) {
    return c.json({ error: "ไม่พบ Project นี้" }, 404);
  }

  // 2) Workflow Statuses (คอลัมน์ Kanban) เรียงตาม sortOrder
  const statuses = await db
    .select({
      id: workflowStatuses.id,
      name: workflowStatuses.name,
      color: workflowStatuses.color,
      category: workflowStatuses.category,
      sortOrder: workflowStatuses.sortOrder,
    })
    .from(workflowStatuses)
    .where(eq(workflowStatuses.projectId, projectId))
    .orderBy(workflowStatuses.sortOrder);

  // 3) Tasks ทั้งหมดของ Project (ผ่าน Feature) พร้อม assignee
  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      workflowStatusId: tasks.workflowStatusId,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      budgetCost: tasks.budgetCost,
      featureId: tasks.featureId,
      assigneeId: users.id,
      assigneeName: users.name,
      assigneeImage: users.image,
    })
    .from(tasks)
    .innerJoin(features, eq(tasks.featureId, features.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(features.projectId, projectId));

  const taskIds = taskRows.map((t) => t.id);

  // 4) Custom Field Values ของ Task ทั้งหมด (entityType = 'task') + join นิยาม field
  const customFieldRows = taskIds.length
    ? await db
        .select({
          entityId: customFieldValues.entityId,
          fieldId: customFields.id,
          fieldName: customFields.fieldName,
          fieldType: customFields.fieldType,
          value: customFieldValues.value,
        })
        .from(customFieldValues)
        .innerJoin(customFields, eq(customFieldValues.customFieldId, customFields.id))
        .where(
          and(
            inArray(customFieldValues.entityId, taskIds),
            eq(customFields.entityType, "task") // กัน id ชนกับ entity อื่น (polymorphic key)
          )
        )
    : [];

  // custom_field_values เป็น polymorphic (entity_type, entity_id) — กรองเฉพาะ field ที่นิยามไว้กับ 'task'
  const taskCustomFieldsMap = new Map<number, Array<{ fieldId: number; fieldName: string; fieldType: string; value: string | null }>>();
  for (const row of customFieldRows) {
    const list = taskCustomFieldsMap.get(row.entityId) ?? [];
    list.push({ fieldId: row.fieldId, fieldName: row.fieldName, fieldType: row.fieldType, value: row.value });
    taskCustomFieldsMap.set(row.entityId, list);
  }

  // 5) Actual Hours แบบ batch (SUM hours_spent group by task)
  const actualHoursMap = await computeActualHoursForTasks(db, taskIds);

  // 6) Progress % + Auto-Dates ระดับ Project
  const [progress, autoDates] = await Promise.all([
    computeProjectProgress(db, projectId),
    computeProjectAutoDates(db, projectId),
  ]);

  // 7) จัดกลุ่ม Task เข้าคอลัมน์ตาม workflowStatusId (คอลัมน์ที่ยังไม่มี Task ก็ต้องแสดง เป็น array ว่าง)
  const columns = statuses.map((status) => ({
    id: status.id,
    name: status.name,
    color: status.color,
    category: status.category,
    sortOrder: status.sortOrder,
    tasks: taskRows
      .filter((t) => t.workflowStatusId === status.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        featureId: t.featureId,
        assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, image: t.assigneeImage } : null,
        startDate: t.startDate,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
        actualHours: actualHoursMap.get(t.id) ?? 0,
        budgetCost: t.budgetCost,
        customFields: taskCustomFieldsMap.get(t.id) ?? [],
      })),
  }));

  return c.json({
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      theme: project.themeId ? { id: project.themeId, name: project.themeName } : null,
      autoDates,
      progress,
    },
    columns,
  });
});
