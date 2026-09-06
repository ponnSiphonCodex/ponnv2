# Portfolio Workspace — PM Platform (v26)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare
(v26 = รวม v25 ทั้งหมด + งานใหม่ 7 ข้อ — สร้างต่อจาก v24 เพราะ v25 zip หาย)

## v26 ใหม่
1. **Mobile UI** — จอเล็ก (<820px) ซ่อน Nav bar เป็น default · แตะโลโก้จรวด (มุมซ้ายบน) = เปิดเมนู drawer · ไอคอนโปรไฟล์อยู่มุมขวาบน แตะเข้า User Profile
2. **ผู้ใช้ใหม่ = คำขอทั้งหมด** — Guest ไม่ขึ้นแท็บ "ผู้ใช้งาน" หลัก แต่ไปอยู่แท็บ **ผู้ใช้ใหม่ (คำขอ)** · มี **badge ตัวเลขแดง** ทั้งบนเมนู "จัดการผู้ใช้งาน" และบนแท็บ
3. **Login เร็วขึ้น** — ตัด redirect ซ้ำ (`/` → dashboard) ล็อกอินเสร็จเด้งตรง `/pm/dashboard` ทันที (ลด auth 2 รอบเหลือ 1)
4. **System Log = localStorage ถาวร** — ไม่หายเมื่อ refresh · เพิ่ม **คำอธิบายการยิง + Endpoint + Request/Response JSON body** (คลิกแถวเพื่อดู) · แสดงไม่รก
5. **เลิกยิงเอง** — System Log ไม่ ping debug/notifications ตลอดอีก (บันทึกเฉพาะ API จริงที่เกิดจากใช้งาน) · **ลบแถบ Notification (กระดิ่ง) ออกทั้งหมด** → ใช้ Telegram แจ้ง Admin แทน (ทุกล็อกอิน + ผู้ใช้ใหม่)
6. **แท็บคำขอ** — ปุ่ม **✓ Approve** (ให้สิทธิ์ User) / **✗ Reject** (ลบ แต่ผู้ใช้ยังขอเข้าใหม่ได้เรื่อยๆ)
7. **Calendar (Meeting)**
   - 7.1 ค้นหา: หัวข้อ / project / product / ผู้เข้าร่วม / คำใน Meeting Minute
   - 7.2 ปุ่ม **Sync → Google Calendar / MS Calendar** (แมนนวลรายมีตติ้ง) ชื่อขึ้นต้น `[mom] xxxxx`
   - 7.3 แนบไฟล์แบบ **ปุ่มตรง**: Meeting Minute · Transcript · ไฟล์อื่นๆ (ไม่ต้องเลือก dropdown ก่อน)
   - 7.4 **cache-first** — โหลดจาก localStorage ทันที refresh เบื้องหลัง ไม่โหลดใหม่ทุกครั้ง

## v25 (รวมมาแล้ว)
รูปโปรไฟล์=Google · hover เมนู+โลโก้ · ไอคอนเส้นหนา · ปุ่ม Google มีสี · Master Data=แท็บ+cache · เลือกสี 20 เฉด · ระดับ 1–10 · placeholder `Xxxxx` · Rich Text editor · เวลา `YYYY-MM-DD HH:mm น.` · pagination 10/หน้า · ลบช่องค้นหา topbar

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo → Commit → Push
2. **DB (Production ปลอดภัย):** รัน `database/migrations/v26_production_safe.sql` ใน D1 Console
   - เพิ่มคอลัมน์ meetings: start_time, organizer, attendees, project_name
   - ขึ้น `duplicate column` = มีแล้ว ข้ามได้ · **ห้ามรัน schema.sql บน prod** (อันนั้น DROP ทุกตาราง)
3. Secret เดิม + `TELEGRAM_ADMIN_CHAT_ID` (สำหรับแจ้ง Admin ทุกล็อกอิน)

## หมายเหตุ Login ช้า (item 3)
สาเหตุหลักที่เหลือคือ **Cloudflare Worker cold start** ครั้งแรก (~300–800ms) — เป็นข้อจำกัดของ serverless แก้ที่โค้ดได้แค่ลด query/redirect (ทำแล้ว). ถ้าต้องเร็วคงที่ ต้องใช้ Workers paid plan (ลด cold start) หรือ warm-up cron

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
