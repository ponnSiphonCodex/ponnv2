import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext(); if (!c || !c.admin) return Response.json({ error: "forbidden" }, { status: 403 });
  const us = await c.d1.prepare(`SELECT id, name, email FROM users ORDER BY email`).all();
  return Response.json({ users: us.results ?? [] });
}
