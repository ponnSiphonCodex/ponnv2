# Portfolio Workspace — PM & Portfolio (Cloudflare D1 + Workers)

## ⚠️ Login fix (v12) — ต้นตอ error=Configuration
ตัด custom jwt.encode/decode ใน `apps/web/src/lib/auth.ts` ออก (ตัวการที่ทำ Auth.js init fail →
"Server error / problem with server configuration") ใช้ Auth.js มาตรฐาน + board query D1 ตรง

## Login
- Google OAuth **หรือ** Email+Password (2 แท็บ)
- Local user ทดสอบ: `admin@ponnsth.com` / `Ponnsth@2026` (seed ใน schema.sql)

## Routing
- `/login` — 2 แท็บ, Sarabun 14px, 100dvh ไม่ scroll
- `/` — portal (redirect /pm ถ้าสิทธิ์เดียว)
- `/pm/board?id=1` — Kanban (query D1 ตรง ไม่พึ่ง API worker)
- `/api/debug` — เช็ค D1 + secrets (ลบทิ้งหลัง debug)

## หมายเหตุ
- API worker (`apps/api`, Hono) เป็น optional — web app ทำงานในตัวเอง ไม่พึ่งแล้ว
- แก้ schema ต้องแก้ทั้ง `apps/api/src/db/schema.ts` + `apps/web/src/db/schema.ts`
