# Portfolio Workspace — PM Platform (v21)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare

## ใหม่ใน v21 (ต่อยอด v20) — ทำ P1→P2→P3

### 🔴 P1 — ใช้งานจริง
- **Task Detail Drawer** — คลิกการ์ด Kanban เปิดแผงข้าง แก้ได้ทุก field (สถานะ/ผู้รับผิดชอบ/priority/feature/วันที่/ชม./งบ/โน้ต/tags) + แท็บ คอมเมนต์ · ลงเวลา · ไฟล์แนบ · Dependencies · ประวัติ
- **Telegram auto-notify** — ยิงจริงตอน: มอบหมายงาน, เปลี่ยนสถานะ, มีคอมเมนต์ + Cron `/api/cron/due-soon` เตือนงานใกล้ครบกำหนด (ตั้ง `CRON_SECRET` + Cloudflare Cron Trigger)
- **Attachment ผูกงานจริง** — แนบไฟล์เข้า task → ขึ้น Drive → บันทึกลง `attachments`
- **Impersonate audit** — บันทึก activity + แจ้ง Admin Telegram ทุกครั้งที่ admin สวม/ออกบทบาท
- **Rollup lib** — คำนวณ progress/budget/hours/date แบบ bottom-up (task→feature→project)

### 🟠 P2 — ครบ PM core
- **Comment thread + Activity log** UI ในการ์ดงาน
- **Notifications กระดิ่ง** — มุมขวาบน + badge unread + auto-poll 30s
- **Task Dependencies** — เพิ่ม predecessor (FS/SS/FF/SF) ในการ์ด
- **Tags บน task** — ติ๊ก tag บนการ์ด
- **Sprint Board** — เมนูใหม่ แยกงานตาม Sprint + Backlog
- **Milestones บน Gantt & Calendar** — แสดงเป็นหมุด ◆

### 🟡 P3 — Flexibility & UX
- **Global Search** — ค้นโครงการ/งาน/คน/issue จาก topbar (respect scope)
- **Custom Fields** — สร้าง field เอง (Text/Number/Date/Dropdown/Checkbox) ต่อ task/project/feature + กรอกค่าในการ์ด
- **Dashboard charts** — แถบสถานะงาน + ภาระงานต่อคน

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo (โครง `apps/web/...`) → Commit → Push → Cloudflare build
2. **ไม่ต้องรัน migration ใหม่ถ้าเคยรัน v20 schema แล้ว** (v21 ใช้ตารางเดิมทั้งหมด) — ถ้ายังไม่เคย ให้รัน `database/migrations/schema.sql` ใน D1 Console
3. Secret ใน Cloudflare: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_DOMAINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, (option) `CRON_SECRET`

## Cron (แจ้งเตือนใกล้ครบกำหนด)
สร้าง Cloudflare Cron Trigger เรียก: `GET https://pm.ponnsth.com/api/cron/due-soon?key=<CRON_SECRET>` ทุกวันเช้า

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)

## ยังเหลือ (roadmap ถัดไป)
- Multi-view สลับในหน้าเดียว + filter/group, Bulk actions (เลือกหลาย task), Dependency เส้นบน Gantt, Soft delete, Export Excel/PDF, Rentals module
