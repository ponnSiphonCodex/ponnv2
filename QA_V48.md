# QA V48 - Navigation, Gantt Interaction, Project List

## Navigation
- ลด vertical padding ของเมนูจาก 9px เป็น 7px
- ลดระยะระหว่างกลุ่มเมนูจาก 10px เป็น 6px

## Gantt
- พื้นที่ว่างในแถว Project และ Task ใช้ cursor แบบเมาส์บวกและสร้าง Task ของ Project นั้น
- Task bar ใช้ cursor ปกติและคลิกเปิด Task Drawer
- ชื่อ Task แสดง overflow ต่อเนื่อง พร้อม text shadow ให้อ่านง่าย
- Milestone คลิกเปิดหน้าแก้ไข Milestone
- เพิ่มปุ่มและ modal สร้าง Milestone บน Gantt
- Milestone อยู่ระดับ Project และเส้นเริ่มจาก Project ลงด้านล่าง

## Project List
- แก้ server exception จาก SQL aggregation ให้รองรับ Cloudflare D1
- Default เป็น Active
- แท็บ Active / ทั้งหมด
- ปุ่มเพิ่ม Project สำหรับ PMO
