import { apiContext } from "@/lib/api-auth";
import { refOptions, crudList } from "@/lib/crud";
import { ENTITIES } from "@/lib/entities";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext();
  if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (c.guest) return Response.json({ generatedAt: Date.now(), refs: {}, master: {} });
  try {
    const profile = await c.d1.prepare(`SELECT id,name,email,company_email,phone,telegram_user_id,telegram_notify,image,avatar_url,pm_role,CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END AS has_password FROM users WHERE id=?`).bind(c.me.sub).first<any>();
    const names = ["products","projects","users","priorities","categories","tags","sprints","themes","initiatives","workflow-statuses"];
    const refs: Record<string, any[]> = {};
    await Promise.all(names.map(async n => { try { refs[n] = await refOptions(c.d1, n); } catch { refs[n] = []; } }));
    const masters = Array.from(new Set([...Object.entries(ENTITIES).filter(([,d]) => d.masterOnly).map(([n]) => n), "products", "projects", "milestones"]));
    const master: Record<string, any> = {};
    await Promise.all(masters.map(async n => { try { master[n] = { rows: await crudList(c.d1, n, null), canWrite: c.scope.isPmo }; } catch { master[n] = { rows: [], canWrite: c.scope.isPmo }; } }));
    return Response.json({ generatedAt: Date.now(), profile: { profile }, refs, master }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 }); }
}
