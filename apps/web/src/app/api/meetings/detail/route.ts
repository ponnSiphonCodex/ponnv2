import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return Response.json({ meeting: null });
  const m = await c.d1.prepare(`SELECT * FROM meetings WHERE id=?`).bind(id).first<any>();
  const files = (await c.d1.prepare(`SELECT id, file_name, file_type, gdrive_web_link, created_at FROM attachments WHERE reference_type='meeting' AND reference_id=? ORDER BY created_at DESC`).bind(id).all()).results ?? [];
  return Response.json({ meeting: m, files });
}
