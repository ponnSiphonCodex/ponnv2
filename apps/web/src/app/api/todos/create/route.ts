import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.title) return Response.json({ error: "ต้องมี title" }, { status: 400 });
  const td = b.targetDate ? Math.floor(Date.parse(b.targetDate + "T00:00:00Z") / 1000) : null;
  await c.d1.prepare(`INSERT INTO user_todos (user_id, title, target_date, status, created_by, updated_by) VALUES (?,?,?,'todo',?,?)`).bind(c.me.sub, b.title, td, c.me.sub, c.me.sub).run();
  return Response.json({ ok: true });
}
