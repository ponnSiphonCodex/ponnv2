import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";

// Export risks เป็น CSV (เปิด Excel ได้) — filter: projectId, status, ระยะเวลาย้อนหลัง
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return new Response("unauthorized", { status: 401 });
  if (c.guest) return new Response("forbidden", { status: 403 });
  const u = new URL(req.url);
  const projectId = u.searchParams.get("projectId");
  const status = u.searchParams.get("status");
  const months = Number(u.searchParams.get("months") || "12");
  const since = Math.floor(Date.now() / 1000) - months * 30 * 24 * 3600;

  try {
    const rows = ((await c.d1.prepare(
      `SELECT r.id, r.title, r.description, r.probability, r.impact, r.mitigation_plan, r.status,
         pj.id AS project_id, pj.name AS project_name, u.name AS owner_name,
         r.created_at, r.updated_at
       FROM risks r
       LEFT JOIN projects pj ON r.project_id=pj.id
       LEFT JOIN users u ON r.owner_id=u.id
       WHERE r.created_at >= ?
       ORDER BY r.updated_at DESC`
    ).bind(since).all()).results ?? []) as any[];

    const ids = await visibleProjectIds(c.d1, c.scope);
    let filtered = rows;
    if (!c.scope.isPmo && ids) { const set = new Set(ids); filtered = rows.filter((r) => r.project_id && set.has(r.project_id)); }
    if (projectId) filtered = filtered.filter((r) => String(r.project_id) === projectId);
    if (status) filtered = filtered.filter((r) => r.status === status);

    const fmt = (u: number | null) => u ? new Date(u * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16) : "";
    const esc = (v: any) => { const s = (v ?? "").toString().replace(/"/g, '""'); return `"${s}"`; };
    const header = ["ID", "ความเสี่ยง", "Project", "โอกาสเกิด", "ผลกระทบ", "ผู้รับผิดชอบ", "สถานะ", "แผนรับมือ", "รายละเอียด", "สร้างเมื่อ", "อัปเดตล่าสุด"];
    const lines = [header.map(esc).join(",")];
    for (const r of filtered) lines.push([r.id, r.title, r.project_name, r.probability, r.impact, r.owner_name, r.status, r.mitigation_plan, r.description, fmt(r.created_at), fmt(r.updated_at)].map(esc).join(","));
    const csv = "\uFEFF" + lines.join("\r\n");
    const fname = `risks_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fname}"` } });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : String(e), { status: 500 });
  }
}
