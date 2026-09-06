import { createDb, type DbClient } from "@/db";
/**
 * notify.ts — ศูนย์กลางการแจ้งเตือน (in-app notifications + Telegram)
 * ใช้จากทุก API route: assign งาน, เปลี่ยนสถานะ, comment, ใกล้ due ฯลฯ
 */
import { sendTelegram } from "./telegram";

export type NotifyInput = {
  d1: DbClient;
  env: CloudflareEnv;
  targetUserId: string;          // ผู้รับ
  actorId?: string | null;       // ผู้กระทำ
  actionType: string;            // Assigned | Status_Changed | Commented | Due_Soon | Mentioned | ...
  referenceType?: string;
  referenceId?: number;
  message: string;               // ข้อความ (แสดงทั้ง in-app + telegram)
};

// สร้าง in-app notification + ยิง Telegram (ถ้า user เปิดไว้) — best effort ไม่ throw
export async function notify(input: NotifyInput): Promise<void> {
  const { d1, env, targetUserId, actorId, actionType, referenceType, referenceId, message } = input;
  try {
    // อย่าเตือนตัวเอง
    if (actorId && actorId === targetUserId) return;
    await d1.prepare(
      `INSERT INTO notifications (user_id, actor_id, action_type, reference_type, reference_id, message) VALUES (?,?,?,?,?,?)`
    ).bind(targetUserId, actorId ?? null, actionType, referenceType ?? null, referenceId ?? null, message).run();

    const u = await d1.prepare(`SELECT telegram_user_id, telegram_notify, name FROM users WHERE id=?`).bind(targetUserId).first<any>();
    const token = env.TELEGRAM_BOT_TOKEN;
    if (token && u?.telegram_notify && u?.telegram_user_id) {
      await sendTelegram(token, u.telegram_user_id, `🔔 <b>PM Platform</b>\n${message}`);
    }
  } catch { /* silent */ }
}

// ชื่อระบบ (prefix ทุกข้อความ ให้ admin ที่ดูแลหลายระบบแยกออกว่ามาจากระบบไหน)
const SYS_TAG = "🚀 <b>[PM Platform · pm.ponnsth.com]</b>";
// แจ้ง admin chat (governance / เหตุการณ์สำคัญ) — ใส่ tag ระบบไว้บรรทัดแรกเสมอ
export async function notifyAdminChat(env: CloudflareEnv, message: string): Promise<void> {
  try {
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ADMIN_CHAT_ID) {
      await sendTelegram(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_ADMIN_CHAT_ID, `${SYS_TAG}\n${message}`);
    }
  } catch { /* silent */ }
}

// บันทึก activity log (audit trail)
export async function logActivity(d1: DbClient, p: { referenceType: string; referenceId: number; userId: string | null; action: string; fieldChanged?: string | null; oldValue?: string | null; newValue?: string | null }): Promise<void> {
  try {
    await d1.prepare(
      `INSERT INTO activity_logs (reference_type, reference_id, user_id, action, field_changed, old_value, new_value) VALUES (?,?,?,?,?,?,?)`
    ).bind(p.referenceType, p.referenceId, p.userId, p.action, p.fieldChanged ?? null, p.oldValue ?? null, p.newValue ?? null).run();
  } catch { /* silent */ }
}
