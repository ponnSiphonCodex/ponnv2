import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.customFieldId || !b.referenceId) return Response.json({ error: "invalid" }, { status: 400 });
  const def = await c.d1.prepare(`SELECT field_type FROM custom_fields WHERE id=?`).bind(b.customFieldId).first<any>();
  let vs: any = null, vn: any = null, vd: any = null;
  if (def?.field_type === "Number") vn = b.value === "" || b.value == null ? null : Number(b.value);
  else if (def?.field_type === "Date") vd = b.value ? Math.floor(Date.parse(String(b.value).length === 10 ? b.value + "T00:00:00Z" : b.value) / 1000) : null;
  else vs = b.value ?? null;
  const ex = await c.d1.prepare(`SELECT id FROM custom_field_values WHERE custom_field_id=? AND reference_id=?`).bind(b.customFieldId, b.referenceId).first<any>();
  if (ex) await c.d1.prepare(`UPDATE custom_field_values SET value_string=?, value_number=?, value_date=?, updated_at=unixepoch() WHERE id=?`).bind(vs, vn, vd, ex.id).run();
  else await c.d1.prepare(`INSERT INTO custom_field_values (custom_field_id, reference_id, value_string, value_number, value_date, created_by, updated_by) VALUES (?,?,?,?,?,?,?)`).bind(b.customFieldId, b.referenceId, vs, vn, vd, c.me.sub, c.me.sub).run();
  return Response.json({ ok: true });
}
