# Portfolio Workspace — Enterprise Project Management & Portfolio

Cloudflare stack ล้วน (D1 + Workers), Notion + Jira flexibility

## ⚠️ Rotate Google OAuth Secret ก่อนใช้งานจริง
Reset ที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

📄 **วิธี Deploy** → ดู `DEPLOY_GUIDE_GUI.md`

---

## 1. โครงสร้างสำคัญ

`apps/api` และ `apps/web` เป็นโปรเจกต์อิสระแยกกันสมบูรณ์ (ไม่มี workspace) ทั้งสองมี
`src/db/schema.ts` เป็นของตัวเอง — **ถ้าแก้ schema ต้องแก้ 2 จุดให้ตรงกัน**

## 2. Routing

| Path | หน้าที่ |
|---|---|
| `/login` | login ด้วย Google **หรือ** อีเมล+รหัสผ่าน (2 แท็บ) — การ์ด "Portfolio Workspace" กลางจอ, สูงพอดี 100dvh ไม่มี scroll |
| `/` | Portal — สิทธิ์เดียว/ยังไม่ตั้งสิทธิ์ → redirect `/pm` ตรง; สิทธิ์หลายระบบ → แสดง portal |
| `/pm` | redirect ไป `/pm/board?id=1` |
| `/pm/board?id=:projectId` | Kanban Board — ใช้ query param แทน dynamic route `[projectId]` |
| `/api/debug` | **Diagnostic endpoint** — เปิดตรงในเบราว์เซอร์เพื่อเช็คว่า D1 เชื่อมต่อได้จริงไหม + secrets ครบไหม (ดู DEPLOY_GUIDE_GUI.md) |

## 3. Local Email+Password Login

เพิ่มคอลัมน์ `password_hash` ในตาราง `users` (migration `0001_add_local_auth.sql`) — hash ด้วย
PBKDF2-SHA256 ผ่าน Web Crypto (`apps/web/src/lib/password.ts`) ไม่ใช้ bcryptjs เพื่อให้ทำงานบน
Cloudflare Workers runtime ได้ตรงแน่นอน (ทดสอบแล้วว่า hash ที่ generate จาก Node.js กับที่ verify
บน Workers ให้ผลตรงกัน เพราะใช้ Web Crypto API ตัวเดียวกัน)

รูปแบบที่เก็บ: `"<iterations>:<saltHex>:<hashHex>"` — user ที่ login ผ่าน Google เท่านั้นจะมีค่า
`password_hash = NULL` (login local ไม่ได้จนกว่าจะตั้งรหัสผ่านให้)

⚠️ โฟลเดอร์ชื่อวงเล็บที่เหลืออยู่ตัวเดียวคือ `src/app/api/auth/[...nextauth]/` (บังคับโดย Auth.js)

## 4. Favicon / Logo

โลโก้จรวด (rocket) ใช้เป็นทั้ง favicon และโลโก้หน้า login:
- `apps/web/src/app/icon.png` — Next.js App Router auto-detect เป็น favicon (512×512)
- `apps/web/src/app/apple-icon.png` — สำหรับ iOS home screen (พื้นหลังขาว)
- `apps/web/src/app/favicon.ico` — multi-size (16/32/48) เผื่อ browser เก่า
- `apps/web/public/rocket-logo.png` — ไฟล์เดียวกัน ใช้ใน `<Image>` ที่หน้า login โดยตรง

ไม่ต้องเพิ่ม code ใด ๆ ใน `layout.tsx` — Next.js inject `<link rel="icon">` ให้อัตโนมัติเมื่อเจอไฟล์
ชื่อ `icon.png` / `favicon.ico` / `apple-icon.png` ในโฟลเดอร์ `app/`

## 5. Business Logic (`apps/api/src/lib/progress.ts`)

| Requirement | วิธีคำนวณ |
|---|---|
| Auto-Dates | `MIN(task.start_date)` / `MAX(task.due_date)` |
| Progress % | `count(done) / count(total)` |
| Actual Hours | `SUM(task_worklogs.hours_spent)` real-time |

## 6. Endpoint หลัก

| Method | Path |
|---|---|
| GET | `/api/projects` |
| **GET** | **`/api/projects/:id/board`** |
| PATCH | `/api/tasks/:id/status` |
| POST | `/api/tasks/:id/worklogs` |
