# QA V43 - Cumulative Release

## Baseline
- Source baseline: ponnv2-v37.zip
- รวมการแก้ไขที่ตกหล่นจาก V38-V42 กลับเข้าชุดเดียว ไม่ย้อน feature

## Cumulative regression checklist
- PASS: Navbar ชั้นเดียว 4 กลุ่ม Overview / Project / MOM / Setting
- PASS: Project List เป็นหน้าหลัก และ Create Project เป็นฟังก์ชันจากหน้านี้
- PASS: Kanban drag/drop, WIP warning, mobile long-press จาก baseline
- PASS: Gantt Advanced รองรับ Multi Project, Product, Feature, Date Range
- PASS: Gantt controls แยกบรรทัดจาก filters
- PASS: Day / Week / Month และ By Project / By Workforce
- PASS: Week เริ่มวันจันทร์, Weekend shading
- PASS: Month/Year แยก header band ไม่ทำให้ scale offset
- PASS: Milestone เป็นเส้นแนวตั้งพร้อม label
- PASS: Gantt filter ไม่ซ้ำ
- PASS: Profile ไม่มี Workload / Overdue / Availability / Role
- PASS: Body/Form font 15px, Page Header 18px, Field hint 12px
- PASS: Meeting list ไม่มีคำว่า มีบันทึก และแสดงจำนวนไฟล์แนบ
- PASS: Sync Google Calendar / MS Outlook อยู่ใน Meeting Editor
- PASS: Side-panel animation แบบ Notion
- PASS: System version แสดง 2 บรรทัดใต้ชื่อระบบ
- PASS: Today Planning full width
- PASS: Calendar/Meeting default Today จาก baseline
- PASS: Date format rule จาก baseline
- PASS: Safe SQL retention rule จาก baseline

## Code QA
- PASS: TypeScript transpile syntax QA ทุกไฟล์ .ts/.tsx = 0 errors
- PASS: Root cause JSX ของ board-client และ Today marker ไม่กลับมา
- PASS: ZIP integrity
