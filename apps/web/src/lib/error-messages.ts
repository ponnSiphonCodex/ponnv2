/**
 * apps/web/src/lib/error-messages.ts
 * แปล error ทางเทคนิค (D1_ERROR, SQLITE_ERROR, network error ฯลฯ) เป็นข้อความ
 * ที่ผู้ใช้ทั่วไปอ่านเข้าใจ — ตามกฎ 2.4 ห้ามโชว์ Technical Jargon ในข้อความแจ้งเตือน
 * ผู้ใช้ปลายทางเห็นแค่ข้อความนี้ ส่วนรายละเอียดจริงจะถูก log ไว้ฝั่ง server เท่านั้น
 */
export function toFriendlyMessage(rawError: string, statusCode?: number): string {
  const lower = rawError.toLowerCase();

  if (lower.includes("no such table") || lower.includes("sqlite_error") || lower.includes("d1_error")) {
    return "ระบบยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ";
  }
  if (lower.includes("client id mismatch") || lower.includes("token expired") || lower.includes("invalid google token")) {
    return "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }
  if (lower.includes("อีเมลหรือรหัสผ่านไม่ถูกต้อง")) {
    return rawError; // ข้อความนี้เป็นภาษาไทยที่เข้าใจง่ายอยู่แล้ว ส่งต่อได้เลย
  }
  if (statusCode === 401) {
    return "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }
  if (statusCode && statusCode >= 500) {
    return "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่";
  }
  return "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}
