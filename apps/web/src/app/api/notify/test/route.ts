import { apiContext } from "@/lib/api-auth";
import { sendTelegram } from "@/lib/telegram";
export const dynamic = "force-dynamic";
export async function POST() {
  const c = await apiContext(); if (!c) return Response.json({ error: "unauthorized" }, { status: 401 });
  const token = c.env.TELEGRAM_BOT_TOKEN;
  if (!token) return Response.json({ ok: false, error: "ยังไม่ได้ตั้ง TELEGRAM_BOT_TOKEN ใน Cloudflare" }, { status: 400 });
  const u = await c.d1.prepare(`SELECT telegram_user_id, telegram_notify, name FROM users WHERE id=?`).bind(c.me.sub).first<any>();
  if (!u?.telegram_user_id) return Response.json({ ok: false, error: "ยังไม่ได้ใส่ Telegram User ID" }, { status: 400 });
  const r = await sendTelegram(token, u.telegram_user_id, `✅ ทดสอบแจ้งเตือนจาก PM Platform ถึง <b>${u.name ?? ""}</b> สำเร็จ`);
  // แจ้ง admin chat ด้วย (ถ้าตั้งไว้)
  if (c.env.TELEGRAM_ADMIN_CHAT_ID) await sendTelegram(token, c.env.TELEGRAM_ADMIN_CHAT_ID, `ℹ️ ${u.name ?? c.me.email} ทดสอบการแจ้งเตือน Telegram`);
  return Response.json(r);
}
