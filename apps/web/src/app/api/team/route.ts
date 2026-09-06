import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";

// Working Team ตาม scope + roster (คนไม่ login) + per-user hidden
// PMO/Admin: เห็นทุกคน · Product Owner: คนใน product+project ที่ดูแล · PM: member ใน project ที่ดูแล
export async function GET() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ members: [], roster: [], hidden: [], canManage: false });
  const ids = await visibleProjectIds(c.d1, c.scope); // null = ทุกโครงการ (PMO/Admin)

  // เก็บ user id ที่ควรเห็น
  const allow = new Set<string>();
  allow.add(c.me.sub); // เห็นตัวเองเสมอ
  if (ids === null) {
    const all = (await c.d1.prepare(`SELECT id FROM users WHERE active=1 AND pm_role IS NOT NULL`).all()).results ?? [];
    for (const u of all as any[]) allow.add(u.id);
  } else if (ids.length) {
    const ph = ids.map(() => "?").join(",");
    // PM ของ project ที่เห็น
    for (const r of ((await c.d1.prepare(`SELECT DISTINCT user_id FROM project_managers WHERE project_id IN (${ph})`).bind(...ids).all()).results ?? []) as any[]) allow.add(r.user_id);
    // assignee ของ task ใน project ที่เห็น (member)
    for (const r of ((await c.d1.prepare(`SELECT DISTINCT assignee_id FROM tasks WHERE assignee_id IS NOT NULL AND (project_id IN (${ph}) OR feature_id IN (SELECT id FROM features WHERE project_id IN (${ph})))`).bind(...ids, ...ids).all()).results ?? []) as any[]) if (r.assignee_id) allow.add(r.assignee_id);
    // product owner ของ product ที่ครอบ project ที่เห็น (Product Owner เห็นทั้ง layer)
    for (const r of ((await c.d1.prepare(`SELECT DISTINCT po.user_id FROM product_owners po WHERE po.product_id IN (SELECT product_id FROM projects WHERE id IN (${ph}) AND product_id IS NOT NULL)`).bind(...ids).all()).results ?? []) as any[]) allow.add(r.user_id);
  }
  // owner's owned products → project managers under them (Product Owner layer)
  if (c.scope.ownedProductIds.length) {
    const ph = c.scope.ownedProductIds.map(() => "?").join(",");
    for (const r of ((await c.d1.prepare(`SELECT DISTINCT pm.user_id FROM project_managers pm JOIN projects p ON pm.project_id=p.id WHERE p.product_id IN (${ph})`).bind(...c.scope.ownedProductIds).all()).results ?? []) as any[]) allow.add(r.user_id);
    for (const r of ((await c.d1.prepare(`SELECT DISTINCT user_id FROM product_owners WHERE product_id IN (${ph})`).bind(...c.scope.ownedProductIds).all()).results ?? []) as any[]) allow.add(r.user_id);
  }

  const list = Array.from(allow);
  const ph2 = list.map(() => "?").join(",");
  const urows = list.length ? ((await c.d1.prepare(`SELECT id, name, email, pm_role, image, avatar_url FROM users WHERE id IN (${ph2}) AND pm_role IS NOT NULL`).bind(...list).all()).results ?? []) : [];

  // workload + done per user
  const wl = (await c.d1.prepare(`SELECT t.assignee_id AS uid, COUNT(*) AS c FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE t.assignee_id IS NOT NULL AND (ws.category IS NULL OR ws.category NOT IN ('done','drop')) GROUP BY t.assignee_id`).all()).results ?? [];
  const wlMap = new Map<string, number>(); for (const r of wl as any[]) wlMap.set(r.uid, r.c);
  const dn = (await c.d1.prepare(`SELECT t.assignee_id AS uid, COUNT(*) AS c FROM tasks t LEFT JOIN workflow_statuses ws ON t.workflow_status_id=ws.id WHERE ws.category='done' GROUP BY t.assignee_id`).all()).results ?? [];
  const dnMap = new Map<string, number>(); for (const r of dn as any[]) dnMap.set(r.uid, r.c);
  const pm = (await c.d1.prepare(`SELECT pm.user_id AS uid, p.name FROM project_managers pm JOIN projects p ON pm.project_id=p.id`).all()).results ?? [];
  const pmMap = new Map<string, string[]>(); for (const r of pm as any[]) { const l = pmMap.get(r.uid) ?? []; l.push(r.name); pmMap.set(r.uid, l); }
  const po = (await c.d1.prepare(`SELECT po.user_id AS uid, pr.name FROM product_owners po JOIN products pr ON po.product_id=pr.id`).all()).results ?? [];
  const poMap = new Map<string, string[]>(); for (const r of po as any[]) { const l = poMap.get(r.uid) ?? []; l.push(r.name); poMap.set(r.uid, l); }

  const members = (urows as any[]).map((u) => ({ id: u.id, name: u.name, email: u.email, pm_role: u.pm_role, image: u.image, avatar_url: u.avatar_url, active: wlMap.get(u.id) ?? 0, done: dnMap.get(u.id) ?? 0, projects: pmMap.get(u.id) ?? [], products: poMap.get(u.id) ?? [] }));

  // roster ของฉัน (คนไม่ login ที่ฉันเพิ่ม) — และ PMO/Admin เห็นทั้งหมด
  const roster = c.scope.isPmo
    ? ((await c.d1.prepare(`SELECT r.*, p.name AS project_name, pd.name AS product_name FROM team_roster r LEFT JOIN projects p ON r.project_id=p.id LEFT JOIN products pd ON r.product_id=pd.id ORDER BY r.id DESC`).all()).results ?? [])
    : ((await c.d1.prepare(`SELECT r.*, p.name AS project_name, pd.name AS product_name FROM team_roster r LEFT JOIN projects p ON r.project_id=p.id LEFT JOIN products pd ON r.product_id=pd.id WHERE r.owner_user_id=? ORDER BY r.id DESC`).bind(c.me.sub).all()).results ?? []);

  const hidden = ((await c.d1.prepare(`SELECT target_kind, target_id FROM team_hidden WHERE viewer_id=?`).bind(c.me.sub).all()).results ?? []).map((h: any) => `${h.target_kind}:${h.target_id}`);

  const projects = (await c.d1.prepare(`SELECT id, name FROM projects ORDER BY name`).all()).results ?? [];
  const products = (await c.d1.prepare(`SELECT id, name FROM products ORDER BY name`).all()).results ?? [];
  return Response.json({ members, roster, hidden, projects, products, pmRoles: ["PMO", "Product Owner", "Project Manager", "Project Co-Ordinator", "Working Team"], canManage: true, meId: c.me.sub });
}

// เพิ่มคนแบบ manual (ไม่ login)
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c || c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.name?.trim()) return Response.json({ error: "ต้องมีชื่อ" }, { status: 400 });
  const res = await c.d1.prepare(`INSERT INTO team_roster (name, responsibility, pm_role, project_id, product_id, owner_user_id) VALUES (?,?,?,?,?,?)`)
    .bind(b.name, b.responsibility ?? null, b.pmRole ?? null, b.projectId ?? null, b.productId ?? null, c.me.sub).run();
  return Response.json({ ok: true, id: Number(res.meta?.last_row_id ?? 0) });
}

// toggle hidden (เฉพาะ view ของ user นั้นๆ)
export async function PATCH(req: NextRequest) {
  const c = await apiContext(); if (!c || c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (b.hidden) await c.d1.prepare(`INSERT OR IGNORE INTO team_hidden (viewer_id, target_kind, target_id) VALUES (?,?,?)`).bind(c.me.sub, b.targetKind, String(b.targetId)).run();
  else await c.d1.prepare(`DELETE FROM team_hidden WHERE viewer_id=? AND target_kind=? AND target_id=?`).bind(c.me.sub, b.targetKind, String(b.targetId)).run();
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c || c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await c.d1.prepare(`DELETE FROM team_roster WHERE id=? AND (owner_user_id=? OR ?=1)`).bind(id, c.me.sub, c.scope.isPmo ? 1 : 0).run();
  return Response.json({ ok: true });
}
