import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ issue: null });
  const i = await c.d1.prepare(`SELECT * FROM issues WHERE id=?`).bind(id).first<any>();
  return Response.json({ issue: i });
}
