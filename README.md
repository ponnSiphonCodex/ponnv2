# Portfolio Workspace — PM Platform (v20)

ระบบ PM & Portfolio บน Cloudflare (D1 + Workers) — Next.js 15 + Drizzle + @opennextjs/cloudflare

## สิ่งที่เพิ่มใน v20 (รอบนี้)
1. **โลโก้จรวด** แทน Hamburger (คลิกที่จรวดเพื่อย่อ/ขยายเมนู)
2. **ยกเมนู Logout ออกจาก sidebar** — ไปอยู่ในหน้า User Profile
3. **User Profile Popup** (คลิกรูปโปรไฟล์ซ้ายล่าง): แก้ Display name, เบอร์โทร, อีเมลบริษัท, Telegram User ID + Toggle แจ้งเตือน, แสดง Role, ตั้ง/เปลี่ยนรหัสผ่าน, อัปโหลดรูป, Logout
4. **สลับมุมมองเป็นผู้ใช้อื่น (Impersonate)** — เฉพาะ System Admin, เห็น/ทำแทนได้ทุกอย่าง, ออกได้ทุกเมื่อ (มีแถบเตือนด้านบน)
5. **System Log** (เมนู Admin) — ดูการเรียก API real-time, filter error/ช้า, **ไม่เขียนลง Database**
6. **จัดการผู้ใช้งาน** (เมนู Admin) — ตาราง user + สถานะ + เข้าล่าสุด + device, เปิด/ปิด, เลือก System Role + PM Role, เพิ่ม user, **คำขอเข้าใช้** (login ที่ยังไม่มี role), Top-10 login ต่อคน
7. **Drag & Drop** จริงบน Kanban (ลากข้ามคอลัมน์ + จัดลำดับ)
8. **Offline / Draft autosave** — ฟอร์มเก็บร่างใน localStorage, เขียนตอน offline จะ queue แล้วส่งเมื่อ online
9. **Guest gating** — user ใหม่เห็นแค่หน้า "รอเปิดสิทธิ์" + โปรไฟล์
10. **RBAC จริง 3 ชั้น**: PMO เห็นทั้งหมด · Product Owner เห็น/แก้เฉพาะ Product ที่ดูแล · PM/อื่นๆ เฉพาะ Project ที่ได้รับมอบหมาย

## Telegram
- Bot Token + Admin Chat ID ตั้งเป็น Cloudflare Secret: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`
- ผู้ใช้ใส่ Telegram User ID เองในโปรไฟล์ แล้วกด "ทดสอบส่งข้อความ"

## Deploy
1. GitHub Desktop → วางไฟล์จาก zip ทับ repo (โครง `apps/web/...`) → Commit → Push → Cloudflare build
2. รัน `database/migrations/schema.sql` ใน D1 Console (ไฟล์นี้ DROP+CREATE+SEED ใหม่ทั้งหมด — v20 เปลี่ยน schema เยอะ ต้องรันใหม่)
3. ตั้ง Secret ใน Cloudflare: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_DOMAINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
- somchai@viriyah.co.th (Product Owner — ตั้งรหัสผ่านผ่านโปรไฟล์ หรือให้ login Google)

## System Roles vs PM Roles
- **System Role** (สิทธิ์ระบบ): System Admin / User / Guest
- **PM Role** (บทบาทงาน มีผลกับการมองเห็น): PMO, Product Owner, Project Manager, Project Co-Ordinator, Working Team
  - จริง ๆ มีผล 3 ระดับ: PMO(ทั้งหมด) · Product Owner(เฉพาะ product) · ที่เหลือ(เฉพาะที่ assign)
