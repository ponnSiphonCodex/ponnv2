import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
// GET ?ref=task[&refId=123] : definitions (+ values if refId)
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const u = new URL(req.url); const ref = u.searchParams.get("ref"); const refId = u.searchParams.get("refId");
  const defs = (await c.d1.prepare(`SELECT id, reference_type, name, field_type, options FROM custom_fields ${ref ? "WHERE reference_type=?" : ""} ORDER BY id`).bind(...(ref ? [ref] : [])).all()).results ?? [];
  let values: any[] = [];
  if (refId) values = (await c.d1.prepare(`SELECT custom_field_id, value_string, value_number, value_date FROM custom_field_values WHERE reference_id=?`).bind(Number(refId)).all()).results ?? [];
  return Response.json({ defs, values });
}
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c || !c.scope.isPmo) return Response.json({ error: "forbidden (PMO/Admin)" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.name || !b.referenceType) return Response.json({ error: "invalid" }, { status: 400 });
  await c.d1.prepare(`INSERT INTO custom_fields (reference_type, name, field_type, options, created_by, updated_by) VALUES (?,?,?,?,?,?)`).bind(b.referenceType, b.name, b.fieldType ?? "Text", b.options ?? null, c.me.sub, c.me.sub).run();
  return Response.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c || !c.scope.isPmo) return Response.json({ error: "forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await c.d1.prepare(`DELETE FROM custom_fields WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
