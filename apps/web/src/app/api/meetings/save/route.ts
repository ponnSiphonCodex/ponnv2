import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
function d2u(v: any) { if (!v) return null; const ms = Date.parse(String(v).length === 10 ? v + "T00:00:00Z" : v); return Number.isNaN(ms) ? null : Math.floor(ms / 1000); }

export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.title?.trim()) return Response.json({ error: "ต้องมีหัวข้อประชุม" }, { status: 400 });
  const date = d2u(b.meetingDate);
  const projectIdsJson = JSON.stringify(b.projectIds ?? []);
  const productIdsJson = JSON.stringify(b.productIds ?? []);
  // v28: try/catch ครอบทุก query — กันไม่ให้ error ดิบจาก D1 (เช่น "no such column")
  // กลายเป็น HTML 500 ที่ client parse JSON ไม่ได้ (สาเหตุที่ error message หายเงียบๆ เดิม)
  try {
    if (b.id) {
      await c.d1.prepare(
        `UPDATE meetings SET title=?, meeting_date=?, start_time=?, organizer=?, attendees=?, project_name=?, project_ids=?, product_ids=?, minutes_longtext=?, internal_notes=?, updated_by=?, updated_at=unixepoch() WHERE id=?`
      ).bind(b.title, date, b.startTime ?? null, b.organizer ?? null, b.attendees ?? null, b.projectName ?? null, projectIdsJson, productIdsJson, b.content ?? null, b.internalNotes ?? null, c.me.sub, b.id).run();
      return Response.json({ ok: true, id: b.id });
    }
    const res = await c.d1.prepare(
      `INSERT INTO meetings (title, meeting_date, start_time, organizer, attendees, project_name, project_ids, product_ids, minutes_longtext, internal_notes, created_by, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(b.title, date, b.startTime ?? null, b.organizer ?? null, b.attendees ?? null, b.projectName ?? null, projectIdsJson, productIdsJson, b.content ?? null, b.internalNotes ?? null, c.me.sub, c.me.sub).run();
    return Response.json({ ok: true, id: Number(res.meta?.last_row_id ?? 0) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // ระบุสาเหตุที่พบบ่อยให้ผู้ใช้เข้าใจง่ายขึ้น (แทน SQL error ดิบ)
    const hint = msg.includes("no such column")
      ? `ฐานข้อมูลยังไม่ได้อัปเดตโครงสร้างล่าสุด (${msg}) — แจ้งผู้ดูแลให้รัน migration ให้ครบตามลำดับใน database/migrations/v28_run_one_at_a_time/`
      : msg;
    return Response.json({ error: hint }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ error: "forbidden" }, { status: 403 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  try {
    await c.d1.prepare(`DELETE FROM meetings WHERE id=?`).bind(id).run();
    await c.d1.prepare(`DELETE FROM attachments WHERE reference_type='meeting' AND reference_id=?`).bind(id).run();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
