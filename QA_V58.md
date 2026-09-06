# QA V58 — Gantt Redesign + Project List Hotfix (Full Regression)

## 🔴 Root Cause ที่ทำให้ Project List เจ๊งซ้ำหลายรอบ
- ตาราง `projects` **ไม่มีคอลัมน์ `start_date` / `end_date`** (ดู `database/migrations/schema.sql:64`)
- Backend จริงเป็น **Postgres (Supabase)** ผ่าน `pm_execute` RPC → โค้ด V54–V57 ที่ SELECT/INSERT/UPDATE `p.start_date, p.end_date` ทำให้เกิด server-side exception (Digest 3700953400 ฯลฯ)
- แก้: เลิกอ้างคอลัมน์ที่ไม่มีทั้งหมด → **Timeline ของ Project คำนวณจากช่วงวันของ Task** (`MIN(start_date)`, `MAX(due_date)`)

## ✅ Project List (`/pm/projects`)
- Query ปลอดภัย 3 ชุดผ่าน `Promise.all`: projects / timeline-from-tasks / project-manager
- ตัด N+1 loop และเลี่ยง `GROUP_CONCAT`/`STRING_AGG` (Postgres ไม่มี GROUP_CONCAT)
- คอลัมน์: ID · Project + รายละเอียด (หลายบรรทัด) · Timeline (จาก Task) · PM · Status · แก้ไข
- Default Active + แท็บทั้งหมด + ปุ่มเพิ่ม Project (PMO)
- รองรับ Access Scope (`visibleProjectIds`) และกรณีไม่มี Project

## ✅ Project Create / Edit
- `api/projects/create` และ `api/projects/[id]` เอา `start_date/end_date` ออก, ใช้ timestamp จาก JS (เลี่ยง DB-specific)
- `api/milestones/[id]` เลี่ยง `unixepoch()` แบบ hardcode → bind ts จาก JS
- Wizard: Section Timeline เปลี่ยนเป็นหมายเหตุ (Timeline มาจาก Task อัตโนมัติ) — ฟิลด์เดิมที่อ้างคอลัมน์ผีถูกลบ
- แนบไฟล์ Google Drive → เขียนลง `attachments` (reference_type='project') ทั้ง create/edit

## ✅ Gantt Chart — ดีไซน์ใหม่แบบ Microsoft Project
- **Summary bar**: แถว Product/Project แสดงแท่งสรุปสีน้ำเงินพร้อมหัวสามเหลี่ยม 2 ปลาย (สไตล์ MS Project) ครอบช่วงงานลูก → ไม่ทับกันแล้ว
- **Task bar**: Plan (เทา) ด้านบน + Actual (สีตามสถานะ) ด้านล่าง; ชื่อ Task ย้ายไปอยู่ **ขวาแท่ง** อ่านง่าย ไม่ทับแท่งอื่น
- สีสถานะ: Plan เทา · Done เขียว · เสี่ยง Delay เหลือง · Delay แดง · **Task ที่ Drop ไม่ขึ้นบนกราฟ**
- **เลขวันที่/สัปดาห์ จัดกึ่งกลาง** (center) ในแต่ละช่วง
- **เส้นแนวตั้งเฉพาะขอบช่วง**: Day=ทุกวัน, Week=เฉพาะวันจันทร์, Month=เฉพาะวันที่ 1 — ลากจากแถววันที่ลงถึงล่างสุด
- ลบเส้นขีดแนวนอนใต้แถววันที่ออก
- **เดือนไม่ซ้ำ**: month band (บนสุด) แสดงเดือน+ปีจัดกึ่งกลางที่เดียว; โหมด Month ไม่โชว์ label ซ้ำในแถวที่สอง
- **Milestone**: เพชรอยู่แถวเดียวกับ Project, เส้นลากจากเพชรลงถึงงานสุดท้ายของ Project นั้น (ไม่โผล่เหนือเพชร, ไม่ลากข้าม Project ถัดไป), คลิกเปิด Modal แก้ไข
- **Progress bar**: ใต้ชื่อแต่ละ Project + แถวสุดท้าย "รวมทุก Project" (ย้ายออกจาก toolbar)
- Popup เพิ่ม Milestone มี Dropdown เลือก Project
- ROW_H=44 รองรับ font 15px ไม่ให้ Product/Project ทับกัน

## ✅ Regression (ไม่กระทบของเดิม)
- Kanban: Drag & Drop, Multi Select (Product/Project/Feature), Card Settings (จัดลำดับ/เลือกฟิลด์), Task ID, รายละเอียด Task
- Task Create มีช่องรายละเอียด
- Font baseline 15px, Header 18px
- board-data: single-project board เติมฟิลด์ note/date/status ให้ Card ครบ

## 🧪 วิธี QA
- TypeScript syntax/JSX check ผ่าน(tsc) สำหรับไฟล์ที่แก้ทั้งหมด — ไม่มี error จริง
  (เหลือเฉพาะ false positive ของ `key`/`children` ตอนเช็คไฟล์เดี่ยวแบบ `--noResolve` ซึ่งหายเมื่อใช้ react-jsx runtime)
- ตรวจไม่มีการอ้างคอลัมน์ `start_date/end_date` บน `projects` หลงเหลือ
- ZIP integrity ผ่าน

## ⚠️ หมายเหตุ deploy
- ถ้าเปิดหน้ายัง error ให้ **Ctrl+F5 / Incognito** หลัง Cloudflare deploy จบ
- ถ้าต้องการให้ Project ตั้งวัน Start/End เองในอนาคต ต้องเพิ่มคอลัมน์ใน `projects` ก่อน (migration) แล้วค่อยเปิดฟิลด์ในฟอร์ม
