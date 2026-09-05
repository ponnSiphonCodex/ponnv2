import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const { taskId, tagId, action } = b;
  if (!taskId || !tagId) return Response.json({ error: "invalid" }, { status: 400 });
  if (action === "remove") await c.d1.prepare(`DELETE FROM task_tags WHERE task_id=? AND tag_id=?`).bind(taskId, tagId).run();
  else await c.d1.prepare(`INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?,?)`).bind(taskId, tagId).run();
  return Response.json({ ok: true });
}
