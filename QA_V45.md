# QA V45 - Gantt Chart only

## Scope
- เปลี่ยนหน้า `/pm/gantt` ให้ใช้ GanttClient แบบเต็ม
- ไม่แก้ Business Logic หรือหน้าอื่น

## Changes
- Default scale: Week
- Filter order: Project (Multi Select) > Product > Feature
- Project / Workforce view อยู่บรรทัดเดียวกับ Day / Week / Month
- Product > Project > Task hierarchy
- Week tick เริ่มวันจันทร์
- Month + Year band
- Weekend shading
- Today line
- Milestone แสดงเป็นแถวและ Diamond
- Status colors + Legend
- Horizontal scroll และ Left label panel
- Export Excel/CSV

## Verification
- Source structure checked
- Modified files reviewed by diff
- Full Next.js build was not completed in sandbox because dependency installation exceeded execution timeout
