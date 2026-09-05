/**
 * apps/web/src/lib/board-data.ts
 * Query ข้อมูล Kanban board จาก D1 ตรง ๆ (ใช้ในหน้า board server component)
 * ย้าย logic มาจาก Hono API worker เดิม → web app ไม่ต้องพึ่ง API worker แยกอีกต่อไป
 * (ตัดปัญหา cross-worker cookie / CORS / custom JWT ทั้งหมด)
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  customFields,
  customFieldValues,
  features,
  projects,
  tasks,
  users,
  workflowStatuses,
  taskWorklogs,
} from "@/db";
import type { DbClient } from "@/db";

export type BoardTask = {
  id: number;
  title: string;
  assignee: { id: string; name: string | null; image: string | null } | null;
  startDate: number | null;
  dueDate: number | null;
  estimatedHours: number | null;
  actualHours: number;
  budgetCost: number | null;
  customFields: Array<{ fieldId: number; fieldName: string; fieldType: string; value: string | null }>;
};

export type BoardColumn = {
  id: number;
  name: string;
  color: string | null;
  category: "todo" | "doing" | "done";
  tasks: BoardTask[];
};

export type BoardData = {
  project: {
    id: number;
    name: string;
    status: string | null;
    progress: { total: number; done: number; percent: number };
  };
  columns: BoardColumn[];
};

export async function getBoardData(db: DbClient, projectId: number): Promise<BoardData | null> {
  const [project] = await db
    .select({ id: projects.id, name: projects.name, status: projects.status })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return null;

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

  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      workflowStatusId: tasks.workflowStatusId,
      startDate: tasks.startDate,
      dueDate: tasks.dueDate,
      estimatedHours: tasks.estimatedHours,
      budgetCost: tasks.budgetCost,
      assigneeId: users.id,
      assigneeName: users.name,
      assigneeImage: users.image,
    })
    .from(tasks)
    .innerJoin(features, eq(tasks.featureId, features.id))
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(features.projectId, projectId));

  const taskIds = taskRows.map((t) => t.id);

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
        .where(and(inArray(customFieldValues.entityId, taskIds), eq(customFields.entityType, "task")))
    : [];

  const cfMap = new Map<number, BoardTask["customFields"]>();
  for (const row of customFieldRows) {
    const list = cfMap.get(row.entityId) ?? [];
    list.push({ fieldId: row.fieldId, fieldName: row.fieldName, fieldType: row.fieldType, value: row.value });
    cfMap.set(row.entityId, list);
  }

  const hoursMap = new Map<number, number>();
  if (taskIds.length) {
    const hourRows = await db
      .select({
        taskId: taskWorklogs.taskId,
        actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number),
      })
      .from(taskWorklogs)
      .where(inArray(taskWorklogs.taskId, taskIds))
      .groupBy(taskWorklogs.taskId);
    for (const r of hourRows) hoursMap.set(r.taskId, r.actualHours);
  }

  let doneCount = 0;
  const statusCategoryMap = new Map(statuses.map((s) => [s.id, s.category]));
  for (const t of taskRows) {
    if (statusCategoryMap.get(t.workflowStatusId) === "done") doneCount++;
  }
  const total = taskRows.length;
  const percent = total === 0 ? 0 : Math.round((doneCount / total) * 1000) / 10;

  const columns: BoardColumn[] = statuses.map((status) => ({
    id: status.id,
    name: status.name,
    color: status.color,
    category: status.category,
    tasks: taskRows
      .filter((t) => t.workflowStatusId === status.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, image: t.assigneeImage } : null,
        startDate: t.startDate instanceof Date ? t.startDate.getTime() : null,
        dueDate: t.dueDate instanceof Date ? t.dueDate.getTime() : null,
        estimatedHours: t.estimatedHours,
        actualHours: hoursMap.get(t.id) ?? 0,
        budgetCost: t.budgetCost,
        customFields: cfMap.get(t.id) ?? [],
      })),
  }));

  return {
    project: { id: project.id, name: project.name, status: project.status, progress: { total, done: doneCount, percent } },
    columns,
  };
}
