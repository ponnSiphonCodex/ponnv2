# QA V59 — Date format · System name/version · Category · Actual · Gantt

## ⚠️ ต้องรัน DB migration ก่อน deploy
รัน `database/supabase_v59_safe_migration.sql` ใน Supabase SQL Editor (ADDITIVE ล้วน ไม่มี DROP/DELETE → ข้อมูลเดิมไม่หาย):
- เพิ่มคอลัมน์ `tasks.actual_start_date`, `tasks.actual_end_date`
- สร้างตาราง `project_category_tags(project_id, category)` + unique index

## 1) Date format = YYYY-MM-DD / YYYY-MM-DD HH:mm
- Gantt month band เปลี่ยนจาก "ตุลาคม 2569" → `YYYY-MM`
- Notification / Comment / Activity datetime → `YYYY-MM-DD HH:mm` (sv-SE, Asia/Bangkok)
- Gantt วันที่/สัปดาห์, Project List, Task Table, Export ใช้ `YYYY-MM-DD` อยู่แล้ว

## 2) ชื่อระบบ + เวอร์ชัน
- ชื่อระบบ = **Portfolio-Management** (ชิดซ้าย ตรงคอลัมน์เดียวกับเวอร์ชัน — `.brand-copy` เป็น flex column)
- เวอร์ชัน `v59.2609071430` — คุมจากไฟล์เดียว `apps/web/src/lib/version.ts` (แก้ที่เดียว อัปเดตทุกจอ)

## 3) Project Category (หลาย Category ต่อ Project)
- รายการ: AI-Project, Strategic Project, Product, CR, BAU Project, Process Improvement Project, Cross Function Project Improvement, AIx, TX, Data Project
- เพิ่ม MultiSelect "Category" ใน Project Wizard (Create + Edit) → บันทึกลง `project_category_tags`
- Gantt เพิ่ม Filter **Category** (Multi Select) — filter งานตาม Category ของ Project
- โหลด Category เดิมกลับมาแสดงในหน้า Edit

## 4) ช่องกรอก Actual (แบบละเอียด)
- Task Drawer เพิ่มบล็อก **Actual (ทำจริง)**: วันเริ่มจริง + วันเสร็จจริง (คู่กับบล็อก Plan)
- บันทึกผ่าน `PATCH /api/tasks/[id]` (field: actualStartDate, actualEndDate)
- Gantt แท่ง Actual (ล่าง) วาดจาก Actual dates จริง (ถ้ามี) — สีตามสถานะ Done/เสี่ยง/Delay
- Actual hours ยังมาจาก Worklogs เดิม (ไม่ซ้ำซ้อน)

## 5) Gantt — ลบ Summary Product/Project bar
- ลบแท่งสรุป (Summary) ของ Product/Project ออกทั้งหมด + ลบออกจาก Legend

## 6) Gantt — เพิ่มความสูง + ไม่มีเส้นแนวตั้งบนแถว Product/Project
- ROW_H 44 → **50** (Project ใส่ชื่อ + progress ได้พอ)
- แถว Product/Project/Overall เป็นพื้น**สีทึบ** → บังเส้นแนวตั้งของวันที่บนแถวนั้น (เหลือเส้นเฉพาะแถว Task)

## Regression (ไม่กระทบของเดิม)
- Milestone (เพชรระดับ Project, เส้นถึงงานสุดท้าย, คลิกแก้ไข, เพิ่มเลือก Project)
- Task bar Plan/Actual, งาน Drop ไม่ขึ้น
- เส้นแนวตั้งเฉพาะขอบช่วง (Week=จันทร์, Month=วันที่1), เลขจัดกึ่งกลาง
- Kanban, Card Settings, Project List, Font 15px/Header 18px

## วิธี QA
- TypeScript syntax/JSX check ผ่านทุกไฟล์ที่แก้ (เหลือเฉพาะ false positive `key` prop ตอนเช็คไฟล์เดี่ยว `--noResolve` — โค้ดเดิมของ v58 อยู่แล้ว)
- gantt API หุ้ม try/catch กรณียังไม่ได้ migrate → หน้าไม่ล่ม (แต่ Category/Actual จะยังไม่โชว์จนกว่าจะ migrate)
- ZIP integrity ผ่าน

## หมายเหตุ deploy
1. รัน migration ก่อน → 2. push โค้ด → 3. Cloudflare deploy → 4. Ctrl+F5 / Incognito
