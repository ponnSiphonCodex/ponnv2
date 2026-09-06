import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
// ค้นชื่อประชุม / project / product / ผู้เข้าร่วม / keyword ใน minute
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ ids: [] });
  if (c.guest) return Response.json({ ids: [] });
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 1) return Response.json({ ids: null });
  const like = `%${q}%`;
  const r = await c.d1.prepare(
    `SELECT id FROM meetings WHERE title LIKE ? OR organizer LIKE ? OR attendees LIKE ? OR project_name LIKE ? OR minutes_longtext LIKE ?`
  ).bind(like, like, like, like, like).all();
  return Response.json({ ids: (r.results ?? []).map((x: any) => x.id) });
}
