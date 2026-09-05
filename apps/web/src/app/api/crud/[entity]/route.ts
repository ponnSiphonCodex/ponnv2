import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { entityDef } from "@/lib/entities";
import { crudList, crudCreate } from "@/lib/crud";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";
export async function GET(_req: NextRequest, ctx: { params: Promise<{ entity: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { entity } = await ctx.params;
  const def = entityDef(entity); if (!def) return Response.json({ error: "unknown entity" }, { status: 404 });
  try { const filter = def.scoped ? await visibleProjectIds(c.d1, c.scope) : null; return Response.json({ rows: await crudList(c.d1, entity, filter), def, canWrite: def.masterOnly ? c.scope.isPmo : true }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ entity: string }> }) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const { entity } = await ctx.params;
  const def = entityDef(entity); if (!def) return Response.json({ error: "unknown entity" }, { status: 404 });
  if (def.masterOnly && !c.scope.isPmo) return Response.json({ error: "forbidden (PMO/Admin only)" }, { status: 403 });
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  try { const id = await crudCreate(c.d1, entity, body, c.me.sub); return Response.json({ ok: true, id }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
