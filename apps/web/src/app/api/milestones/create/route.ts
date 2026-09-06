import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const c = await apiContext();
  if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json() as { projectId?: number; title?: string; targetDate?: number };
  if (!body.projectId || !body.title?.trim() || !body.targetDate) return Response.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
  const result = await c.d1.prepare(`INSERT INTO project_milestones (project_id,title,target_date,status,created_by,updated_by) VALUES (?,?,?,'Not Start',?,?) RETURNING id`).bind(body.projectId, body.title.trim(), body.targetDate, c.me.sub, c.me.sub).first<{id:number}>();
  return Response.json({ ok: true, id: result?.id ?? null });
}
