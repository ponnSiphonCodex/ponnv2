// ส่งข้อความผ่าน Telegram Bot (best-effort ไม่ throw)
export async function sendTelegram(botToken: string, chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const j = await res.json().catch(() => ({})) as any;
    return { ok: !!j.ok, error: j.ok ? undefined : (j.description || `HTTP ${res.status}`) };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : String(e) }; }
}
