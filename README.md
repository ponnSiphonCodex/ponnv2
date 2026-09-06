# Portfolio Workspace — PM Platform (v25)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare

## ใหม่ใน v25
0. **ลบช่องค้นหา** ออกจาก topbar (จะเพิ่มค้นหาแยกรายฟังก์ชันภายหลัง)
1. **🔒 Schema Production-Safe** — migration ใหม่ `database/migrations/v25_production_safe.sql` โครงสร้างล้วน **ไม่มี DROP/DELETE** รันบน production ได้ ไม่ลบข้อมูล (schema.sql เดิม = setup ครั้งแรกเท่านั้น)
2. **รูปโปรไฟล์ = Google** — ดึงรูปจาก Google อัปเดตทุกครั้งที่ล็อกอิน เก็บลง DB อัตโนมัติ · ผู้ใช้เปลี่ยน/อัปโหลดรูปเองไม่ได้แล้ว
3. **Hover animation** เมนู sidebar (เลื่อน+ไฮไลต์) + โลโก้ (scale/rotate/glow)
4. **หน้าจัดการผู้ใช้** — 10 คน/หน้า (pagination) · เรียงตามล็อกอินล่าสุด · ค้นหาชื่อ/อีเมล · ปิดผู้ใช้=ลบ (หายจากระบบ ค้นไม่เจอ จนเพิ่มใหม่=คนละคน) · ปุ่ม Log/ปิด เป็นไอคอน minimal · แก้แล้วเซฟเบื้องหลัง ไม่โหลดทั้งหน้า (optimistic) · เวลาแสดง `YYYY-MM-DD HH:mm น.` ทั้งระบบ
5. **ไอคอนเส้นหนาขึ้น** (stroke 2.1) ทั้งระบบ
6. **ไอคอน Google** กลับมาที่ปุ่มล็อกอิน (มีสี)
7. **แจ้ง Admin ทาง Telegram** ทุกครั้งที่มีล็อกอิน + แจ้งพิเศษเมื่อผู้ใช้ใหม่เข้าระบบ (ใช้ `TELEGRAM_ADMIN_CHAT_ID`)
8. **Master Data = แท็บด้านบน** (จาก dropdown) + cache ตารางที่เปิดแล้ว
   - 8.1 เลือกสี = dropdown พร้อมตัวอย่างสี 20 เฉด
   - 8.2 ระดับ = dropdown 1–10
   - 8.3 ตัดข้อความ "ร่างถูกเก็บอัตโนมัติ"
9. **localStorage-first** — draft autosave + offline queue (offline.ts) ยิงเข้า DB เบื้องหลัง ผู้ใช้ไม่เห็นการโหลด
10. **ทุก text field** ใช้ placeholder `Xxxxx` เป็นมาตรฐาน
11. **Meeting Records = Calendar View (default)** สลับเป็นตารางได้
   - Rich Text editor ครบ: **Bold/Italic/Underline · Bullet · Numbering · Tab(indent) · Highlight · Heading · Link**
   - เพิ่ม/แก้ประชุม = **เปิดหน้าใหม่เต็มจอ** (`/pm/meetings/edit`) ไม่ใช่ popup กันปิดพลาด
   - 11.1 แนบไฟล์ Transcript / Meeting Minute / อื่นๆ ได้ (เก็บบน Google Drive)

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo → Commit → Push
2. **DB (Production ปลอดภัย):** รัน `database/migrations/v25_production_safe.sql` ใน D1 Console
   - ถ้าขึ้น `duplicate column name` = คอลัมน์มีแล้ว ข้ามได้ (ไม่กระทบข้อมูล)
   - ⚠️ **อย่ารัน** `schema.sql` บน production (อันนั้น DROP ทุกตาราง — setup ครั้งแรกเท่านั้น)
3. Secret เดิม: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_DOMAINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, (option) `CRON_SECRET`

## Telegram แจ้ง Admin
ใช้ `TELEGRAM_ADMIN_CHAT_ID` (chat id ของ admin). Admin ต้องกด **Start** กับบอทก่อน มิฉะนั้นจะได้ `chat not found`

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
