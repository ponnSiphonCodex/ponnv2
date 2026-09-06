# QA V52

## Gantt hotfix
- แก้ client-side exception จากตัวแปร selectedTasks อยู่นอก scope
- คำนวณ Export และ % Completed ผ่าน visibleTasks ที่เป็น useMemo ระดับ component
- คง Project List เวอร์ชันที่ผู้ใช้ยืนยันว่าใช้งานได้

## Kanban Card Settings (Admin/PMO only)
- แสดง Task ID บังคับทุก Card
- เลือกแสดง Project, Product, Feature, Status, Assignee, Priority, Start Date, Due Date, Actual/Estimate Hours
- เรียงลำดับ Field ด้วยปุ่มขึ้น/ลง
- บันทึกค่าที่เลือกใน localStorage

## Typography
- บังคับ Default 15px ทุก element
- Header หลัก h1 และ page-title = 18px
