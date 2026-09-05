# PM Platform — Enterprise Project Management & Portfolio

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
| `/login` | login ด้วย Google |
| `/` | Portal — สิทธิ์เดียว/ยังไม่ตั้งสิทธิ์ → redirect `/pm` ตรง; สิทธิ์หลายระบบ → แสดง portal |
| `/pm` | redirect ไป `/pm/board?id=1` |
| `/pm/board?id=:projectId` | Kanban Board — **ใช้ query param แทน dynamic route `[projectId]`** เพื่อลดโฟลเดอร์ชื่อวงเล็บ (ปัญหา path length ตอนแตก zip บน Windows) |

⚠️ โฟลเดอร์ชื่อวงเล็บที่เหลืออยู่ตัวเดียวคือ `src/app/api/auth/[...nextauth]/` (บังคับโดย Auth.js
เลี่ยงไม่ได้) — ถ้าแตก zip แล้วไฟล์ในนี้หาย ให้ดูวิธีแก้ path length ใน `DEPLOY_GUIDE_GUI.md`

## 3. Business Logic (`apps/api/src/lib/progress.ts`)

| Requirement | วิธีคำนวณ |
|---|---|
| Auto-Dates | `MIN(task.start_date)` / `MAX(task.due_date)` |
| Progress % | `count(done) / count(total)` |
| Actual Hours | `SUM(task_worklogs.hours_spent)` real-time |

## 4. Endpoint หลัก

| Method | Path |
|---|---|
| GET | `/api/projects` |
| **GET** | **`/api/projects/:id/board`** |
| PATCH | `/api/tasks/:id/status` |
| POST | `/api/tasks/:id/worklogs` |
