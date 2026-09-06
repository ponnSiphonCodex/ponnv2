# Portfolio Workspace — PM Platform (v27)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare
(v27 = ต่อยอดจาก v26)

## v27 ใหม่ (9 ข้อ)
1. **Hover Nav Bar** — เอา background hover ออก เหลือแค่ขยับ (translateX) สะอาดขึ้น
2. **Issues List** — กรองได้ **By Product / Project / สถานะ / ผู้แจ้ง** + ค้นหาหัวข้อ
   - 2.1 เพิ่ม/แก้ Issue = **เปิดหน้าใหม่เต็มจอ** (`/pm/issues/edit`) แนวเดียวกับ Meeting Minute
   - 2.2 **Export → Excel (CSV+BOM อ่านไทยได้)** · Popup เลือก filter ก่อนโหลด (ค่าเริ่มต้น = Project, ย้อนหลัง 1 ปี) · PMO/Admin = ทั้งหมด · คนอื่น = เฉพาะที่เกี่ยวข้อง
3. **Popup สำคัญ** — ฟอร์มกรอกข้อมูล (เพิ่ม/แก้ Master Data, เพิ่มผู้ใช้, เพิ่มงาน, โปรไฟล์) **ไม่ปิดเมื่อคลิกพื้นหลัง** แล้ว (กันปิดพลาด) — ปิดด้วยปุ่มยกเลิก/X เท่านั้น
4. **Telegram แจ้งเตือน** — ขึ้นต้นทุกข้อความด้วย `🚀 [PM Platform · pm.ponnsth.com]` แยกจากระบบอื่นที่คุณดูแล
5. **Working Team** — เห็นเฉพาะทีมที่เกี่ยวข้องตาม role (Product Owner เห็น layer Product+Project ที่ดูแล · PM เห็น member เฉพาะ project ตัวเอง · PMO/Admin เห็นหมด) · **เพิ่มคนเองได้** (คนไม่ login ใส่ชื่อ+ความรับผิดชอบ) · **ซ่อน/แสดงรายคน** (มีผลเฉพาะมุมมองของ user นั้น)
6. **Milestone & ทุกตาราง** — เอา **Project ขึ้นคอลัมน์แรก** · **ค้นหา + เรียงได้ทุกคอลัมน์** (คลิกหัวตาราง ▲▼)
7. **Master Data** — ตาราง**โชว์สีจริง** (chip สี) · แก้ overflow เกิน 100% (wrap `md-scroll`)
8. **Nav Sub-Menu** — ปรับ UX: parent ไม่ pink เต็มแล้ว (ใช้จุด accent) · sub-item ใช้เส้น pink ซ้าย + ไอคอน pink — ดูสะอาด ไม่ตลก
9. **Kanban** — เพิ่มตัวเลือก **"ทุกโครงการ (รวม)"** (aggregate ตาม category) · เลือกทีละ project ที่เกี่ยวข้องได้เหมือนเดิม · **หัว column สีเต็มแถบ** แยกด้วยสีชัด (Backlog เทา · To Do น้ำเงิน · In Progress เหลือง · Done เขียว · Drop แดง) + การ์ดมีเส้นสีซ้ายตาม column

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo → Commit → Push
2. **DB (Production ปลอดภัย):** รัน `database/migrations/v27_production_safe.sql` ใน D1 Console
   - เพิ่มตาราง `team_roster`, `team_hidden` (สำหรับ Working Team ข้อ 5) + คอลัมน์ meetings เดิม
   - ขึ้น `duplicate column/table exists` = มีแล้ว ข้ามได้ · **ห้ามรัน schema.sql บน prod** (DROP ทุกตาราง)
3. Secret เดิม + `TELEGRAM_ADMIN_CHAT_ID`

## หมายเหตุ
- **Export เป็น CSV** (เปิดใน Excel ได้ทันที มี BOM รองรับภาษาไทย) — ไม่ใช่ .xlsx จริง เพราะ Worker สร้าง binary xlsx ไม่คุ้ม; ถ้าต้องการ .xlsx แท้บอกได้
- Kanban "ทุกโครงการ" = อ่าน/เปิด drawer แก้ได้ แต่ **ลากข้ามคอลัมน์ไม่ได้** (เพราะแต่ละโครงการมี workflow ของตัวเอง) — ต้องเข้าโครงการนั้นเพื่อลาก

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
