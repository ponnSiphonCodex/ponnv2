import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { entityDef } from "@/lib/entities";
import { crudUpdate, crudDelete } from "@/lib/crud";
import { canEditProject } from "@/lib/access";
export const dynamic = "force-dynamic";
async function guardProject(c: any, entity: string, id: number): Promise<string | null> {
  if (entity !== "projects") return null;
  if (c.scope.isPmo) return null;
  const row = await c.d1.prepare(`SELECT id, product_id FROM projects WHERE id = ?`).bind(id).first<any>();
  if (!row) return "not found";
  return canEditProject(c.scope, row.id, row.product_id) ? null : "คุณไม่มีสิทธิ์แก้โปรเจกต์นี้";
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ entity: string; id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { entity, id } = await ctx.params;
  const def = entityDef(entity); if (!def) return Response.json({ error: "unknown entity" }, { status: 404 });
  if (def.masterOnly && !c.scope.isPmo) return Response.json({ error: "forbidden" }, { status: 403 });
  const g = await guardProject(c, entity, Number(id)); if (g) return Response.json({ error: g }, { status: 403 });
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  try { await crudUpdate(c.d1, entity, Number(id), body, c.me.sub); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ entity: string; id: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { entity, id } = await ctx.params;
  const def = entityDef(entity); if (!def) return Response.json({ error: "unknown entity" }, { status: 404 });
  if (def.masterOnly && !c.scope.isPmo) return Response.json({ error: "forbidden" }, { status: 403 });
  const g = await guardProject(c, entity, Number(id)); if (g) return Response.json({ error: g }, { status: 403 });
  try { await crudDelete(c.d1, entity, Number(id)); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
