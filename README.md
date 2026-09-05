# Portfolio Workspace — PM Platform (v22)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare

## ใหม่ใน v22 — Performance + UI polish
### ⚡ แก้ความช้า (กดแล้วรอ ~2 วิ → ทันที)
- **Optimistic UI ทุกจุด** — Kanban drag, เพิ่มงาน, แก้ในการ์ด, To-do, ตาราง CRUD อัปเดตหน้าจอ**ทันที** แล้วค่อย sync กับ server เบื้องหลัง (ไม่ `router.refresh()` ทั้งหน้าอีกต่อไป)
- **Task Drawer optimistic** — แก้ field เห็นผลทันทีทั้งในดรอเวอร์และการ์ด board
- **Query เร็วขึ้น** — board รวม worklog ด้วย `LEFT JOIN aggregate` (เดิม subquery ต่อแถว) + เพิ่ม index `product_owners/project_managers(user_id)`
- **CRUD manager** — โหลด ref options ครั้งเดียว, หลัง save ดึงเฉพาะแถว

### 🎨 UI
- **ไอคอนเมนู Minimal** — เปลี่ยนจาก emoji เป็น line-icon สีขาว (contrast บนพื้น navy) ชุดเดียวกันทั้งระบบ
- **โลโก้จรวด** (line style) แทนปุ่ม hamburger — คลิกเพื่อย่อ/ขยายเมนู (ใช้ในหน้า login ด้วย)
- **ลบเมนู System Secrets** ออกทั้งหมด

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo → Commit → Push
2. **DB migration:** ถ้าเคยรัน v20/v21 แล้ว รันเฉพาะ 2 บรรทัดนี้ใน D1 Console (เพิ่ม index — ไม่บังคับแต่แนะนำ):
   ```sql
   CREATE INDEX IF NOT EXISTS product_owners_user_idx ON product_owners(user_id);
   CREATE INDEX IF NOT EXISTS project_managers_user_idx ON project_managers(user_id);
   ```
   ถ้ายังไม่เคยรันเลย ให้รัน `database/migrations/schema.sql` ทั้งไฟล์
3. Secret เดิม: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_DOMAINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, (option) `CRON_SECRET`

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)

## หมายเหตุ performance
Optimistic = หน้าจอตอบทันที; ถ้า network ช้าหรือ offline ระบบยัง queue ให้อัตโนมัติ (ธง "ส่งข้อมูลที่ค้างไว้..." เมื่อกลับมา online)
