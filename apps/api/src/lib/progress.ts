/**
 * apps/api/src/lib/progress.ts
 * Business logic ที่ spec กำหนดไว้ตรง ๆ 3 ข้อ:
 *   1) Auto-Dates  : start_date = MIN(task.start_date), due_date = MAX(task.due_date)
 *   2) Progress %  : count(task in status.category='done') / count(task ทั้งหมด)
 *   3) Actual Hours: SUM(task_worklogs.hours_spent) แบบ real-time (ไม่ cache)
 *
 * ทุกฟังก์ชันคำนวณ on-the-fly ตอน query ไม่มีการ denormalize ค่าเหล่านี้ลงตาราง
 * เพื่อกันข้อมูลไม่ sync กับ Task ล่าสุด
 */
import { eq, inArray, sql } from "drizzle-orm";
import { features, tasks, taskWorklogs, workflowStatuses } from "@pm-platform/db";
import type { DbClient } from "@pm-platform/db";

export type ProgressResult = {
  total: number;
  done: number;
  percent: number; // 0–100 ทศนิยม 1 ตำแหน่ง
};

export type AutoDates = {
  startDate: Date | null;
  dueDate: Date | null;
};

function epochToDate(epochSeconds: number | null): Date | null {
  return epochSeconds ? new Date(epochSeconds * 1000) : null;
}

/** Progress % ของ Project ทั้งก้อน (รวมทุก Feature/Task ในโปรเจกต์) */
export async function computeProjectProgress(db: DbClient, projectId: number): Promise<ProgressResult> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      done: sql<number>`sum(case when ${workflowStatuses.category} = 'done' then 1 else 0 end)`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(features, eq(tasks.featureId, features.id))
    .innerJoin(workflowStatuses, eq(tasks.workflowStatusId, workflowStatuses.id))
    .where(eq(features.projectId, projectId));

  const total = row?.total ?? 0;
  const done = row?.done ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 1000) / 10;
  return { total, done, percent };
}

/** Progress % ระดับ Feature เดียว */
export async function computeFeatureProgress(db: DbClient, featureId: number): Promise<ProgressResult> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number),
      done: sql<number>`sum(case when ${workflowStatuses.category} = 'done' then 1 else 0 end)`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(workflowStatuses, eq(tasks.workflowStatusId, workflowStatuses.id))
    .where(eq(tasks.featureId, featureId));

  const total = row?.total ?? 0;
  const done = row?.done ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 1000) / 10;
  return { total, done, percent };
}

/** Auto-Dates ของ Project = MIN/MAX ของ Task ทุกตัวใน Project (ผ่าน Feature) */
export async function computeProjectAutoDates(db: DbClient, projectId: number): Promise<AutoDates> {
  const [row] = await db
    .select({
      startDate: sql<number | null>`min(${tasks.startDate})`.mapWith(Number),
      dueDate: sql<number | null>`max(${tasks.dueDate})`.mapWith(Number),
    })
    .from(tasks)
    .innerJoin(features, eq(tasks.featureId, features.id))
    .where(eq(features.projectId, projectId));

  return { startDate: epochToDate(row?.startDate ?? null), dueDate: epochToDate(row?.dueDate ?? null) };
}

/** Auto-Dates ของ Feature เดียว = MIN/MAX ของ Task ที่อยู่ใน Feature นั้น */
export async function computeFeatureAutoDates(db: DbClient, featureId: number): Promise<AutoDates> {
  const [row] = await db
    .select({
      startDate: sql<number | null>`min(${tasks.startDate})`.mapWith(Number),
      dueDate: sql<number | null>`max(${tasks.dueDate})`.mapWith(Number),
    })
    .from(tasks)
    .where(eq(tasks.featureId, featureId));

  return { startDate: epochToDate(row?.startDate ?? null), dueDate: epochToDate(row?.dueDate ?? null) };
}

/** Actual Hours ของ Task เดียว = SUM(hours_spent) */
export async function computeTaskActualHours(db: DbClient, taskId: number): Promise<number> {
  const [row] = await db
    .select({ actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number) })
    .from(taskWorklogs)
    .where(eq(taskWorklogs.taskId, taskId));
  return row?.actualHours ?? 0;
}

/**
 * Actual Hours แบบ batch สำหรับหลาย Task พร้อมกัน (ใช้ตอน render Board ทั้งกระดาน
 * เพื่อเลี่ยงการยิง query ทีละ Task — สำคัญมากเมื่อ Task มีเป็นร้อย)
 */
export async function computeActualHoursForTasks(db: DbClient, taskIds: number[]): Promise<Map<number, number>> {
  if (taskIds.length === 0) return new Map();

  const rows = await db
    .select({
      taskId: taskWorklogs.taskId,
      actualHours: sql<number>`coalesce(sum(${taskWorklogs.hoursSpent}), 0)`.mapWith(Number),
    })
    .from(taskWorklogs)
    .where(inArray(taskWorklogs.taskId, taskIds))
    .groupBy(taskWorklogs.taskId);

  return new Map(rows.map((r) => [r.taskId, r.actualHours]));
}
