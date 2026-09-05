import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { notify } from "@/lib/notify";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.referenceType || !b.referenceId || !b.content?.trim()) return Response.json({ error: "invalid" }, { status: 400 });
  await c.d1.prepare(`INSERT INTO comments (reference_type, reference_id, user_id, content, created_by, updated_by) VALUES (?,?,?,?,?,?)`).bind(b.referenceType, b.referenceId, c.me.sub, b.content, c.me.sub, c.me.sub).run();
  // notify assignee ของ task
  if (b.referenceType === "task") {
    const t = await c.d1.prepare(`SELECT title, assignee_id FROM tasks WHERE id=?`).bind(b.referenceId).first<any>();
    if (t?.assignee_id) await notify({ d1: c.d1, env: c.env, targetUserId: t.assignee_id, actorId: c.me.sub, actionType: "Commented", referenceType: "task", referenceId: b.referenceId, message: `${c.me.name ?? "มีคน"} คอมเมนต์ในงาน "${t.title}": ${String(b.content).slice(0,80)}` });
  }
  return Response.json({ ok: true });
}
