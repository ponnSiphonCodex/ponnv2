import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ error: "no id" }, { status: 400 });
  const task = await c.d1.prepare(`SELECT * FROM tasks WHERE id=?`).bind(id).first<any>();
  if (!task) return Response.json({ error: "not found" }, { status: 404 });
  const comments = (await c.d1.prepare(`SELECT c.id, c.content, c.created_at, u.name AS author FROM comments c LEFT JOIN users u ON c.user_id=u.id WHERE c.reference_type='task' AND c.reference_id=? ORDER BY c.created_at`).bind(id).all()).results ?? [];
  const activity = (await c.d1.prepare(`SELECT a.id, a.action, a.field_changed, a.old_value, a.new_value, a.created_at, u.name AS actor FROM activity_logs a LEFT JOIN users u ON a.user_id=u.id WHERE a.reference_type='task' AND a.reference_id=? ORDER BY a.created_at DESC LIMIT 30`).bind(id).all()).results ?? [];
  const attachments = (await c.d1.prepare(`SELECT id, file_name, gdrive_web_link, file_type, created_at FROM attachments WHERE reference_type='task' AND reference_id=? ORDER BY created_at DESC`).bind(id).all()).results ?? [];
  const worklogs = (await c.d1.prepare(`SELECT w.id, w.hours_spent, w.work_date, w.note, u.name AS author FROM task_worklogs w LEFT JOIN users u ON w.user_id=u.id WHERE w.task_id=? ORDER BY w.work_date DESC`).bind(id).all()).results ?? [];
  const tagRows = (await c.d1.prepare(`SELECT tg.id, tg.name, tg.color FROM task_tags tt JOIN tags tg ON tt.tag_id=tg.id WHERE tt.task_id=?`).bind(id).all()).results ?? [];
  return Response.json({ task, comments, activity, attachments, worklogs, tags: tagRows });
}
