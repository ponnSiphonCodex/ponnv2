import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
const SYS_ROLES = [{ id: 1, name: "System Admin" }, { id: 2, name: "User" }, { id: 3, name: "Guest" }];
const PM_ROLES = ["PMO", "Product Owner", "Project Manager", "Project Co-Ordinator", "Working Team"];
export async function GET() {
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ error: "forbidden" }, { status: 403 });
  const us = await c.d1.prepare(`SELECT id, name, email, company_email, phone, active, pm_role, last_login_at, image, avatar_url FROM users ORDER BY last_login_at DESC NULLS LAST, email`).all();
  const users = (us.results ?? []) as any[];
  const rr = await c.d1.prepare(`SELECT ur.user_id, sr.id AS role_id, sr.role_name FROM user_roles ur JOIN system_roles sr ON ur.role_id=sr.id`).all();
  const roleMap = new Map<string, { id: number; name: string }[]>();
  for (const r of (rr.results ?? []) as any[]) { const l = roleMap.get(r.user_id) ?? []; l.push({ id: r.role_id, name: r.role_name }); roleMap.set(r.user_id, l); }
  // login logs top 10 per user
  const lg = await c.d1.prepare(`SELECT user_id, email, auth_provider, device_info, ip_address, success, login_time FROM login_logs ORDER BY login_time DESC LIMIT 300`).all();
  const logsAll = (lg.results ?? []) as any[];
  const logMap = new Map<string, any[]>();
  for (const l of logsAll) { const key = l.user_id ?? `email:${l.email}`; const arr = logMap.get(key) ?? []; if (arr.length < 10) arr.push(l); logMap.set(key, arr); }
  // orphan logins (ยังไม่มี user record) → เสนอให้เพิ่ม
  const known = new Set(users.map((u) => u.email));
  const orphanMap = new Map<string, any>();
  for (const l of logsAll) if (l.email && !known.has(l.email)) { if (!orphanMap.has(l.email)) orphanMap.set(l.email, { email: l.email, lastLogin: l.login_time, device: l.device_info, count: 0 }); orphanMap.get(l.email).count++; }
  return Response.json({
    users: users.map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [], logins: (logMap.get(u.id) ?? logMap.get(`email:${u.email}`) ?? []) })),
    orphanLogins: Array.from(orphanMap.values()),
    sysRoles: SYS_ROLES, pmRoles: PM_ROLES,
  });
}
export async function POST(req: NextRequest) {
  // add new user (จาก log ที่ยังไม่มี role หรือกรอกเอง)
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.email) return Response.json({ error: "ต้องมีอีเมล" }, { status: 400 });
  let u = await c.d1.prepare(`SELECT id FROM users WHERE email=?`).bind(b.email).first<any>();
  let id = u?.id as string | undefined;
  if (!id) { id = crypto.randomUUID(); await c.d1.prepare(`INSERT INTO users (id, name, email, pm_role, active) VALUES (?,?,?,?,1)`).bind(id, b.name ?? b.email, b.email, b.pmRole ?? null).run(); }
  else await c.d1.prepare(`UPDATE users SET pm_role=?, name=COALESCE(?,name), active=1 WHERE id=?`).bind(b.pmRole ?? null, b.name ?? null, id).run();
  const roleId = b.sysRoleId ?? 2;
  await c.d1.prepare(`DELETE FROM user_roles WHERE user_id=?`).bind(id).run();
  await c.d1.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?,?)`).bind(id, roleId).run();
  return Response.json({ ok: true, id });
}
export async function PATCH(req: NextRequest) {
  // edit user: sysRole, pmRole, active
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.userId) return Response.json({ error: "ต้องมี userId" }, { status: 400 });
  if ("active" in b) await c.d1.prepare(`UPDATE users SET active=?, updated_at=unixepoch() WHERE id=?`).bind(b.active ? 1 : 0, b.userId).run();
  if ("pmRole" in b) await c.d1.prepare(`UPDATE users SET pm_role=?, updated_at=unixepoch() WHERE id=?`).bind(b.pmRole || null, b.userId).run();
  if ("name" in b) await c.d1.prepare(`UPDATE users SET name=?, updated_at=unixepoch() WHERE id=?`).bind(b.name || null, b.userId).run();
  if ("sysRoleId" in b) { await c.d1.prepare(`DELETE FROM user_roles WHERE user_id=?`).bind(b.userId).run(); await c.d1.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?,?)`).bind(b.userId, b.sysRoleId).run(); }
  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ error: "forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "no id" }, { status: 400 });
  await c.d1.prepare(`DELETE FROM user_roles WHERE user_id=?`).bind(id).run();
  await c.d1.prepare(`DELETE FROM users WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
