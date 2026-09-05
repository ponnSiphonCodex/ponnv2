/**
 * apps/api/src/routes/tasks.ts
 * Endpoint ที่ Kanban board เรียกใช้บ่อยที่สุด: ย้าย Task ข้ามคอลัมน์ (drag & drop)
 * และบันทึกชั่วโมงทำงาน (Task_Worklogs) ซึ่งกระทบ Actual Hours แบบ real-time
 */
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { activityLogs, taskWorklogs, tasks, workflowStatuses } from "@pm-platform/db";
import { createDb } from "@pm-platform/db";
import type { AppEnv } from "../types";
import { computeTaskActualHours } from "../lib/progress";

export const taskRoutes = new Hono<AppEnv>();

/** PATCH /api/tasks/:id/status — ลาก Task ไปวางคอลัมน์ใหม่ */
taskRoutes.patch("/:id/status", async (c) => {
  const taskId = Number(c.req.param("id"));
  if (!Number.isInteger(taskId)) return c.json({ error: "id ต้องเป็นตัวเลข" }, 400);

  const { workflowStatusId } = await c.req.json<{ workflowStatusId: number }>();
  const db = createDb(c.env.DB);
  const user = c.get("user");

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!existing) return c.json({ error: "ไม่พบ Task นี้" }, 404);

  const [targetStatus] = await db.select().from(workflowStatuses).where(eq(workflowStatuses.id, workflowStatusId));
  if (!targetStatus) return c.json({ error: "ไม่พบ Workflow Status ปลายทาง" }, 400);

  const [updated] = await db
    .update(tasks)
    .set({ workflowStatusId, updatedBy: user.id })
    .where(eq(tasks.id, taskId))
    .returning();

  // บันทึก activity log ทุกครั้งที่มีการย้ายสถานะ (audit trail สำหรับ Kanban)
  await db.insert(activityLogs).values({
    entityType: "task",
    entityId: taskId,
    userId: user.id,
    action: "status_changed",
    fieldChanged: "workflow_status_id",
    oldValue: String(existing.workflowStatusId),
    newValue: String(workflowStatusId),
  });

  return c.json({ task: updated });
});

/** POST /api/tasks/:id/worklogs — log ชั่วโมงทำงานรายวัน */
taskRoutes.post("/:id/worklogs", async (c) => {
  const taskId = Number(c.req.param("id"));
  if (!Number.isInteger(taskId)) return c.json({ error: "id ต้องเป็นตัวเลข" }, 400);

  const body = await c.req.json<{ workDate: string; hoursSpent: number; note?: string }>();
  if (!body.hoursSpent || body.hoursSpent <= 0) {
    return c.json({ error: "hoursSpent ต้องมากกว่า 0" }, 400);
  }

  const db = createDb(c.env.DB);
  const user = c.get("user");

  const [log] = await db
    .insert(taskWorklogs)
    .values({
      taskId,
      userId: user.id,
      workDate: new Date(body.workDate),
      hoursSpent: body.hoursSpent,
      note: body.note,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  const actualHours = await computeTaskActualHours(db, taskId);

  return c.json({ worklog: log, actualHours }, 201);
});
