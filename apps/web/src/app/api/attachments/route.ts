import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.referenceType || !b.referenceId || !b.gdriveWebLink) return Response.json({ error: "invalid" }, { status: 400 });
  await c.d1.prepare(`INSERT INTO attachments (reference_type, reference_id, file_type, file_name, gdrive_file_id, gdrive_web_link, uploaded_by) VALUES (?,?,?,?,?,?,?)`).bind(b.referenceType, b.referenceId, b.fileType ?? "Other", b.fileName ?? null, b.gdriveFileId ?? null, b.gdriveWebLink, c.me.sub).run();
  return Response.json({ ok: true });
}
export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  await c.d1.prepare(`DELETE FROM attachments WHERE id=?`).bind(id).run();
  return Response.json({ ok: true });
}
