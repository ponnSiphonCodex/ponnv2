import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext();
  if (!c || !c.admin) return Response.json({ count: 0 }, { headers: { "Cache-Control": "no-store" } });
  try {
    const row = await c.d1.prepare(`SELECT COUNT(DISTINCT u.id) AS n FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN system_roles sr ON ur.role_id=sr.id WHERE sr.role_name='Guest' AND u.active=1`).first<any>();
    return Response.json({ count: Number(row?.n ?? 0) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { return Response.json({ count: 0, error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
