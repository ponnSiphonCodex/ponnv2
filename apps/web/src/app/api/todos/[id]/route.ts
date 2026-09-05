import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  await c.d1.prepare(`UPDATE user_todos SET status=?, updated_at=unixepoch() WHERE id=? AND user_id=?`).bind(b.status ?? "todo", Number(id), c.me.sub).run();
  return Response.json({ ok: true });
}
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  await c.d1.prepare(`DELETE FROM user_todos WHERE id=? AND user_id=?`).bind(Number(id), c.me.sub).run();
  return Response.json({ ok: true });
}
