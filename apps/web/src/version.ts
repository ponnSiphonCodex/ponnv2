/**
 * apps/web/src/version.ts
 *
 * ⚠️ APP_VERSION ต้องตรงกับ apps/api/src/version.ts เป๊ะ ๆ เสมอ — ใช้เป็น
 * "ตัวบังคับ logout" อัตโนมัติเวลา deploy เวอร์ชันใหม่ (ดู lib/auth.ts และ
 * apps/api/src/middleware/auth.ts) เพราะ session cookie ตั้งอายุยาวเป็นสิบปี
 * (ตั้งใจให้ "อยู่ตลอดไป") การ invalidate session เก่าเลยทำผ่านการเทียบเลข
 * เวอร์ชันในตัว JWT แทนการหมดอายุตามเวลา
 *
 * ทุกครั้งที่ deploy เวอร์ชันใหม่ที่ต้องการบังคับให้ทุกคน login ใหม่ (เช่น
 * เปลี่ยนโครงสร้างสิทธิ์, แก้ auth logic) ให้ขยับเลขนี้ขึ้นทั้ง 2 ไฟล์พร้อมกัน
 */
export const APP_VERSION = "2026.09.05-1";
