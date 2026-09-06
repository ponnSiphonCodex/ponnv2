# Portfolio Workspace — PM Platform (v28)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare

## ⚠️ Deploy DB ก่อน — สำคัญมาก (แก้ root cause บั๊คทั้ง SQL + บันทึกประชุมไม่ได้)
**สาเหตุจริงที่พบ:** ไฟล์ migration เดิมรวมหลาย `ALTER TABLE` ไว้ก้อนเดียว — พอมีคำสั่งซ้ำ (duplicate column)
**ทั้งก้อนล้มเหลว** ทำให้ `attendees`, `project_name`, ตาราง `team_roster`/`team_hidden` **ไม่ถูกสร้างจริง**
แม้ Console จะโชว์ "Executed 6/6" ก็ตาม — นี่คือสาเหตุที่บันทึกประชุมพัง (เพราะ INSERT อ้างคอลัมน์ที่ไม่มีจริง)

**วิธีแก้ (ต้องทำ):** ไปที่ `database/migrations/v28_run_one_at_a_time/`
1. เปิดไฟล์ `README.md` ในโฟลเดอร์นั้นอ่านก่อน
2. รันไฟล์ `01_...` ถึง `08d_...` **ทีละไฟล์** (คัดลอก → วาง → Run → ไปไฟล์ถัดไป) — ห้ามรวมกัน
3. รัน `09_verify.sql` และ `10_verify_tables.sql` เพื่อเช็คว่าครบจริง
4. หรือเปิด `/api/debug` บนเว็บ — จะมี `schema_check.migration_complete: true/false` บอกตรงๆ ว่าครบหรือยัง

## v28 ใหม่ (แก้บั๊ค QA รอบ 2)
1. **SQL Error** — แยก migration เป็นไฟล์ละ 1 คำสั่ง (ดูหัวข้อ Deploy ด้านบน) + เพิ่ม `/api/debug` เช็คสคีมาอัตโนมัติ
2. **Reject ไม่หาย / badge ไม่หด / รีเฟรชไม่กลับ** — แก้ต้นตอ: เดิม reject เป็น optimistic-only (ลบจอโดยไม่เช็คผลจริงจาก server) และ orphan-reject เป็น React state ล้วนๆ (หายเมื่อ refresh) ➜ ตอนนี้ทุก approve/reject **ตรวจผลจริงจาก server, revert ถ้าล้มเหลว, refetch จาก DB เสมอ**, orphan-reject เก็บ localStorage ให้จำข้าม refresh ได้จริง, และ sidebar badge อัปเดตทันทีผ่าน event (ไม่ต้องรอเปลี่ยนหน้า)
3. **บันทึกประชุมไม่ได้** — พบ root cause 2 จุด: (1) คอลัมน์ขาดหายจากบั๊ค SQL ข้อ 1 (2) API ไม่มี `try/catch` ทำให้ error ดิบกลายเป็น HTML 500 ที่ฝั่ง client parse JSON ไม่ได้ (error หายเงียบ) ➜ แก้ทั้งคู่ + Popup แจ้งเหตุผลจริงเป็นภาษาที่เข้าใจง่าย (ผ่าน popup theme ไม่ใช่ browser alert)
4. **Export/เพิ่ม Issue ชิดขวา** + **เพิ่ม Export Excel ให้ Risks ด้วย** (เดิมมีแค่ Issues)

## v28 อื่นๆ (ตามคำขอรอบแรก)
- Login default = บัญชี Google
- Popup ยืนยันทุกจุดเป็น theme วิริยะ (เลิก browser confirm/alert ทั้งหมด)
- โปรไฟล์ preload ตั้งแต่ล็อกอิน + Cache TTL ตามความถี่ข้อมูล (profile 7 วัน, master data 30 วัน, projects/users 14 วัน, งาน/issue realtime แต่โชว์ cache ระหว่างรอ)
- Skeleton Loading (shimmer) แทน "กำลังโหลด..." ทุกตาราง/การ์ด
- Date format มาตรฐาน `YYYY-MM-DD` / `YYYY-MM-DD HH:mm น.` ทุกที่
- To-Day Planning ขยายเต็มความกว้าง 2 คอลัมน์เท่ากัน (แก้บั๊คกว้างไม่เท่ากันเดิม) + แนบไฟล์ได้
- **Gantt Chart ยกเครื่อง**: Day/Week/Month, แสดง Task จริง, ทุกโครงการเรียง Product→Project, โหมด Workforce Management, Export Excel, เส้นแนวตั้ง subtle + เส้นวันนี้, ลูกศร Dependency (SVG)
- บันทึกประชุม: Product/Project เป็น Multi-Select dropdown + แนบไฟล์ = save-as-step อัตโนมัติ (มี popup ยืนยัน)

## หมายเหตุ
- Export = CSV (เปิด Excel ได้ทันที มี BOM ภาษาไทย) ไม่ใช่ .xlsx แท้
- Gantt "ทุกโครงการ" อ่านอย่างเดียว (ไม่มีการลาก)

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
