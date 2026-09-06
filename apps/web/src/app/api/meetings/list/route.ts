import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ meetings: [] });
  try {
    const r = await c.d1.prepare(
      `SELECT m.id, m.title, m.meeting_date, m.start_time, m.organizer, m.attendees, m.project_name,
         COALESCE((SELECT COUNT(*) FROM attachments a WHERE a.reference_type='meeting' AND a.reference_id=m.id AND a.file_type='Minute'),0) AS min_cnt,
         COALESCE((SELECT COUNT(*) FROM attachments a WHERE a.reference_type='meeting' AND a.reference_id=m.id AND a.file_type='Transcript'),0) AS tr_cnt,
         COALESCE((SELECT COUNT(*) FROM attachments a WHERE a.reference_type='meeting' AND a.reference_id=m.id),0) AS file_cnt,
         (m.minutes_longtext IS NOT NULL AND m.minutes_longtext != '') AS has_note
       FROM meetings m ORDER BY m.meeting_date DESC, m.start_time DESC`
    ).all();
    return Response.json({ meetings: (r.results ?? []) as any[] });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e), meetings: [] }, { status: 500 });
  }
}
