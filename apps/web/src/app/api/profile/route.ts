import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const u = await c.d1.prepare(`SELECT id, name, email, company_email, phone, telegram_user_id, telegram_notify, image, avatar_url, pm_role, password_hash FROM users WHERE id=?`).bind(c.me.sub).first<any>();
  return Response.json({ profile: { ...u, has_password: !!u?.password_hash, password_hash: undefined } });
}
export async function PATCH(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  let b: any; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  const fields: string[] = []; const vals: any[] = [];
  const map: Record<string, string> = { name: "name", companyEmail: "company_email", phone: "phone", telegramUserId: "telegram_user_id", avatarUrl: "avatar_url" };
  for (const [k, col] of Object.entries(map)) if (k in b) { fields.push(`${col}=?`); vals.push(b[k] === "" ? null : b[k]); }
  if ("telegramNotify" in b) { fields.push("telegram_notify=?"); vals.push(b.telegramNotify ? 1 : 0); }
  if (!fields.length) return Response.json({ ok: true });
  fields.push("updated_at=unixepoch()");
  await c.d1.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id=?`).bind(...vals, c.me.sub).run();
  return Response.json({ ok: true });
}
