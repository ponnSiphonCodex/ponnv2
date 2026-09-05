import type { NextRequest } from "next/server";
import { apiContext } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  let b: { password?: string }; try { b = await req.json(); } catch { return Response.json({ error: "bad request" }, { status: 400 }); }
  if (!b.password || b.password.length < 6) return Response.json({ error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
  const hash = await hashPassword(b.password);
  await c.d1.prepare(`UPDATE users SET password_hash=?, updated_at=unixepoch() WHERE id=?`).bind(hash, c.me.sub).run();
  return Response.json({ ok: true });
}
