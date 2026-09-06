import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
// จำนวนคำขอใช้งาน = Guest users + orphan login emails (admin badge)
export async function GET() {
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ count: 0 });
  const g = await c.d1.prepare(`SELECT COUNT(DISTINCT u.id) AS n FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN system_roles sr ON ur.role_id=sr.id WHERE sr.role_name='Guest'`).first<any>();
  const known = await c.d1.prepare(`SELECT DISTINCT email FROM users`).all();
  const set = new Set((known.results ?? []).map((r: any) => r.email));
  const lg = await c.d1.prepare(`SELECT DISTINCT email FROM login_logs WHERE email IS NOT NULL`).all();
  let orphan = 0; for (const r of (lg.results ?? []) as any[]) if (!set.has(r.email)) orphan++;
  return Response.json({ count: Number(g?.n ?? 0) + orphan });
}
