import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.taskId || !b.hours) return Response.json({ error: "ต้องมี task และชั่วโมง" }, { status: 400 });
  const wd = b.date ? Math.floor(Date.parse(b.date + "T00:00:00Z") / 1000) : Math.floor(Date.now() / 1000);
  await c.d1.prepare(`INSERT INTO task_worklogs (task_id, user_id, work_date, hours_spent, note, created_by, updated_by) VALUES (?,?,?,?,?,?,?)`).bind(b.taskId, c.me.sub, wd, b.hours, b.note ?? null, c.me.sub, c.me.sub).run();
  return Response.json({ ok: true });
}
