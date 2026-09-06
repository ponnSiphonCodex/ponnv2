# QA V44 - Final Scope

## Scope 1: Gantt Chart
- PASS: Project เป็น Multi Select และเลือกพร้อมกันได้หลาย Project
- PASS: Product / Feature / Project filters แสดงชุดเดียว ไม่ซ้ำ
- PASS: เดือนและปีอยู่ Header แถวบน
- PASS: วันที่ / สัปดาห์อยู่ Header แถวล่าง
- PASS: Month band คำนวณความกว้างตามจำนวนวันจริง ไม่ทำให้ Timeline scale เคลื่อน
- PASS: By Project / By Workforce และ Day / Week / Month ยังอยู่

## Scope 2: Project List
- PASS: `/pm/projects` แสดงเฉพาะ Active Project เป็นค่าเริ่มต้น
- PASS: แสดง ID, Product, Project, Project Manager, Timeline, Status และจำนวน Tasks
- PASS: มีปุ่ม `เพิ่ม Project ใหม่` ไปยัง `/pm/projects/new`
- PASS: Project ที่มี Project Manager หลายคนแสดงรวมในแถวเดียว ไม่ทำให้ Project ซ้ำ

## Code QA
- PASS: TypeScript syntax transpile ทุกไฟล์ `.ts` และ `.tsx` = 0 errors
- PASS: JSX regression ของ `board-client.tsx` และ Today marker ไม่กลับมา
- PASS: ZIP integrity = no errors
