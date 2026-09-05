import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { visibleProjectIds } from "@/lib/access";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ results: [] });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 2) return Response.json({ results: [] });
  const like = `%${q}%`;
  const ids = await visibleProjectIds(c.d1, c.scope);
  const results: any[] = [];
  // projects (scoped)
  let projSql = `SELECT id, name FROM projects WHERE name LIKE ?`; const pb: any[] = [like];
  if (ids && ids.length >= 0) { if (ids.length === 0) projSql += ` AND 0`; else { projSql += ` AND id IN (${ids.map(()=>"?").join(",")})`; pb.push(...ids); } }
  const pr = await c.d1.prepare(projSql + ` LIMIT 8`).bind(...pb).all();
  for (const r of (pr.results ?? []) as any[]) results.push({ type: "project", id: r.id, title: r.name, href: `/pm/board?id=${r.id}` });
  // tasks
  const tr = await c.d1.prepare(`SELECT t.id, t.title, t.project_id FROM tasks t WHERE t.title LIKE ? LIMIT 12`).bind(like).all();
  for (const r of (tr.results ?? []) as any[]) { if (ids && ids.length >= 0 && r.project_id != null && !ids.includes(r.project_id)) continue; results.push({ type: "task", id: r.id, title: r.title, href: r.project_id ? `/pm/board?id=${r.project_id}` : "#" }); }
  // people
  const ur = await c.d1.prepare(`SELECT id, name, email FROM users WHERE (name LIKE ? OR email LIKE ?) AND active=1 LIMIT 6`).bind(like, like).all();
  for (const r of (ur.results ?? []) as any[]) results.push({ type: "user", id: r.id, title: r.name || r.email, sub: r.email, href: "#" });
  // issues + risks
  const ir = await c.d1.prepare(`SELECT id, title FROM issues WHERE title LIKE ? LIMIT 5`).bind(like).all();
  for (const r of (ir.results ?? []) as any[]) results.push({ type: "issue", id: r.id, title: r.title, href: "/pm/manage/issues" });
  return Response.json({ results });
}
