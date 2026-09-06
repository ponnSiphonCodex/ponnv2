import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.title?.trim()) return Response.json({ error: "ต้องมีหัวข้อปัญหา" }, { status: 400 });
  const refType = b.projectId ? "project" : (b.referenceType ?? "project");
  const refId = b.projectId ?? b.referenceId ?? 0;
  if (b.id) {
    await c.d1.prepare(`UPDATE issues SET title=?, description=?, action_plan=?, status=?, reference_type=?, reference_id=?, raised_by=?, actioned_by=?, updated_by=?, updated_at=unixepoch() WHERE id=?`)
      .bind(b.title, b.description ?? null, b.actionPlan ?? null, b.status ?? "Open", refType, refId, b.raisedBy ?? c.me.sub, b.actionedBy ?? null, c.me.sub, b.id).run();
    return Response.json({ ok: true, id: b.id });
  }
  const res = await c.d1.prepare(`INSERT INTO issues (title, description, action_plan, status, reference_type, reference_id, raised_by, actioned_by, created_by, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(b.title, b.description ?? null, b.actionPlan ?? null, b.status ?? "Open", refType, refId, b.raisedBy ?? c.me.sub, b.actionedBy ?? null, c.me.sub, c.me.sub).run();
  return Response.json({ ok: true, id: Number(res.meta?.last_row_id ?? 0) });
}
export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await c.d1.prepare(`DELETE FROM issues WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
