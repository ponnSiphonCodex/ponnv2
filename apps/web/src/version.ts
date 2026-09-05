/**
 * apps/web/src/version.ts
 * แก้เลขเวอร์ชัน + ข้อความตรงนี้ทุกครั้งที่ deploy ใหญ่ ๆ (ไม่มีระบบ build-time auto-gen
 * เพราะ deploy ผ่าน Cloudflare Dashboard โดยตรง ไม่มี CI step ให้ inject วันเวลา build จริง)
 */
export const APP_VERSION = "v1.1.0";
export const BUILD_NOTE = "2026-09-05 · เพิ่ม Email+Password Login และปรับดีไซน์หน้า Login";
export const VERSION_LABEL = `${APP_VERSION} · ${BUILD_NOTE}`;
