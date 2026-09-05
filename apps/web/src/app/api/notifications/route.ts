import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const r = await c.d1.prepare(`SELECT n.id, n.action_type, n.reference_type, n.reference_id, n.message, n.is_read, n.created_at, a.name AS actor FROM notifications n LEFT JOIN users a ON n.actor_id=a.id WHERE n.user_id=? ORDER BY n.created_at DESC LIMIT 30`).bind(c.me.sub).all();
  const rows = (r.results ?? []) as any[];
  const unread = rows.filter((x) => !x.is_read).length;
  return Response.json({ notifications: rows, unread });
}
export async function POST() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  await c.d1.prepare(`UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0`).bind(c.me.sub).run();
  return Response.json({ ok: true });
}
