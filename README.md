# Portfolio Workspace — PM Platform (v23)

Next.js 15 + Cloudflare D1/Workers + Drizzle + @opennextjs/cloudflare

## ใหม่ใน v23 — Information Architecture (จัดเมนูใหม่แบบ UX Designer)
เหลือ **10 เมนูหลัก** 3 โซน — ของเดิม 20+ เมนู ยุบรวมตาม mental model

### โครงเมนูใหม่
```
🚀 Portfolio  (คลิกโลโก้จรวด = ย่อ/ขยาย)
  Dashboard
── PROJECT ──────────
  Product & Feature        (แท็บ: Products · Features · Requirements · Initiatives · Themes)
  Project ▾                (Expand/Collapse)
     · Tasks List          → Kanban board
     · Calendar View
     · Gantt Chart
     · To-Day Planning     (งานครบกำหนดของฉัน + to-do ส่วนตัว)
  Project Milestone
  Working Team             (roster + workload ต่อคน)
  Issues List              (แท็บ: Issues · Risks)
─────────────────────
  Meeting Records
── SETTING ──────────
  Master Data              (dropdown: Priorities · Categories · Tags · Sprints · Custom Fields)
  จัดการผู้ใช้งาน           (admin)
  System Log               (admin)
```

### เหตุผลการยุบรวม (UX rationale)
| หลักการ | สิ่งที่ทำ |
|---|---|
| Progressive disclosure | Project ซ่อน 4 view ไว้ กดขยายเมื่อใช้ |
| Chunking 7±2 | เหลือ 10 เมนู แบ่ง 3 โซน ลด cognitive load |
| Consolidate by mental model | Theme→Product→Feature = ลำดับชั้นเดียว → หน้าเดียวแบบแท็บ · Issues+Risks = "เฝ้าระวัง" → รวมกัน |
| Task-based navigation | lookup tables (priorities/tags/…) ย้ายไปหลังบ้าน "Master Data" |

### สิ่งที่ย้าย/ยุบ
- Products/Features/Requirements/Initiatives/Themes → **Product & Feature** (แท็บ)
- Kanban/Calendar/Gantt/To-do → **Project** (expand)
- Risks → รวมใน **Issues List**
- Priorities/Categories/Tags/Sprints/Custom Fields → **Master Data** (dropdown)
- Sprint Board → ตัดจากเมนู (ยังเข้าถึงผ่าน route `/pm/sprint-board`)
- **ลบ System Secrets** ออกหมดตั้งแต่ v22

### UI
- ไอคอนเมนู minimal line-icon สีขาว (contrast บน navy)
- โลโก้จรวดแทน hamburger (คลิกย่อ/ขยาย)

## Deploy
1. GitHub Desktop → วางไฟล์ทับ repo → Commit → Push
2. **ไม่ต้อง migrate DB ใหม่** (v23 ไม่แตะ schema) — ถ้ายังไม่เคยรัน ให้รัน `database/migrations/schema.sql`
3. Secret เดิม: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_DOMAINS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, (option) `CRON_SECRET`

## Login ทดสอบ
- ponnsiphon@gmail.com / pn2811qp (System Admin + PMO)
- admin@ponnsth.com / Ponnsth@2026 (System Admin)
