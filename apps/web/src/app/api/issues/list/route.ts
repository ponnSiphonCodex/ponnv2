import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";
// รายการ issues + join ชื่อ project/product/ผู้แจ้ง/ผู้รับผิดชอบ (สำหรับ filter)
export async function GET() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ issues: [], meta: emptyMeta() });
  const ids = await visibleProjectIds(c.d1, c.scope); // null = เห็นทุกโครงการ
  const r = await c.d1.prepare(
    `SELECT i.id, i.title, i.description, i.action_plan, i.status, i.reference_type, i.reference_id,
       i.raised_by, i.actioned_by, i.created_at, i.updated_at,
       pj.id AS project_id, pj.name AS project_name, pd.id AS product_id, pd.name AS product_name,
       ru.name AS raiser_name, au.name AS actioner_name
     FROM issues i
     LEFT JOIN projects pj ON i.reference_type='project' AND i.reference_id=pj.id
     LEFT JOIN products pd ON pj.product_id=pd.id
     LEFT JOIN users ru ON i.raised_by=ru.id
     LEFT JOIN users au ON i.actioned_by=au.id
     ORDER BY i.updated_at DESC, i.id DESC`
  ).all();
  let issues = (r.results ?? []) as any[];
  // scope: ถ้าไม่ใช่ PMO/Admin → เห็นเฉพาะ project ที่เกี่ยวข้อง หรือที่ตัวเองแจ้ง/รับผิดชอบ
  if (ids) { const set = new Set(ids); issues = issues.filter((i) => (i.project_id && set.has(i.project_id)) || i.raised_by === c.me.sub || i.actioned_by === c.me.sub); }
  // meta สำหรับ dropdown filter
  const projects = (await c.d1.prepare(`SELECT id, name FROM projects ORDER BY name`).all()).results ?? [];
  const products = (await c.d1.prepare(`SELECT id, name FROM products ORDER BY name`).all()).results ?? [];
  const users = (await c.d1.prepare(`SELECT id, COALESCE(name,email) AS name FROM users WHERE active=1 ORDER BY name`).all()).results ?? [];
  return Response.json({ issues, meta: { projects, products, users, statuses: ["Open", "In Progress", "Closed"], isPmo: c.scope.isPmo, meId: c.me.sub } });
}
function emptyMeta() { return { projects: [], products: [], users: [], statuses: [], isPmo: false, meId: "" }; }
