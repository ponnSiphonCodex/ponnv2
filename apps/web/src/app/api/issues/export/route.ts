import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";

// Export issues เป็น CSV (เปิดใน Excel ได้) — filter: projectId, productId, status, months ย้อนหลัง
// สิทธิ์: PMO/Admin = ทั้งหมด · คนอื่น = เฉพาะที่เกี่ยวข้อง (project ที่ดูแล / ตัวเองแจ้ง / รับผิดชอบ)
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return new Response("unauthorized", { status: 401 });
  if (c.guest) return new Response("forbidden", { status: 403 });
  const u = new URL(req.url);
  const projectId = u.searchParams.get("projectId");
  const productId = u.searchParams.get("productId");
  const status = u.searchParams.get("status");
  const months = Number(u.searchParams.get("months") || "12");
  const since = Math.floor(Date.now() / 1000) - months * 30 * 24 * 3600;

  const rows = (await c.d1.prepare(
    `SELECT i.id, i.title, i.description, i.action_plan, i.status,
       pj.name AS project_name, pd.name AS product_name,
       ru.name AS raiser_name, au.name AS actioner_name,
       i.raised_by, i.actioned_by, pj.id AS project_id, pd.id AS product_id,
       i.created_at, i.updated_at
     FROM issues i
     LEFT JOIN projects pj ON i.reference_type='project' AND i.reference_id=pj.id
     LEFT JOIN products pd ON pj.product_id=pd.id
     LEFT JOIN users ru ON i.raised_by=ru.id
     LEFT JOIN users au ON i.actioned_by=au.id
     WHERE i.created_at >= ?
     ORDER BY i.updated_at DESC`
  ).bind(since).all()).results as any[];

  const ids = await visibleProjectIds(c.d1, c.scope);
  let filtered = rows;
  if (!c.scope.isPmo && ids) { const set = new Set(ids); filtered = rows.filter((r) => (r.project_id && set.has(r.project_id)) || r.raised_by === c.me.sub || r.actioned_by === c.me.sub); }
  if (projectId) filtered = filtered.filter((r) => String(r.project_id) === projectId);
  if (productId) filtered = filtered.filter((r) => String(r.product_id) === productId);
  if (status) filtered = filtered.filter((r) => r.status === status);

  const fmt = (u: number | null) => u ? new Date(u * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16) : "";
  const esc = (v: any) => { const s = (v ?? "").toString().replace(/"/g, '""'); return `"${s}"`; };
  const header = ["ID", "หัวข้อปัญหา", "Project", "Product", "สถานะ", "ผู้แจ้ง", "ผู้รับผิดชอบ", "รายละเอียด", "แผนแก้ไข", "สร้างเมื่อ", "อัปเดตล่าสุด"];
  const lines = [header.map(esc).join(",")];
  for (const r of filtered) lines.push([r.id, r.title, r.project_name, r.product_name, r.status, r.raiser_name, r.actioner_name, r.description, r.action_plan, fmt(r.created_at), fmt(r.updated_at)].map(esc).join(","));
  const csv = "\uFEFF" + lines.join("\r\n"); // BOM → Excel อ่านภาษาไทยถูก
  const fname = `issues_${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fname}"` } });
}
