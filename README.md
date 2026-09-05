# Portfolio Workspace — Enterprise Project Management & Portfolio

Cloudflare stack ล้วน (D1 + Workers), Notion + Jira flexibility

## ⚠️ Rotate Google OAuth Secret ก่อนใช้งานจริง
Reset ที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

📄 **วิธี Deploy / แก้ไข** → ดู `DEPLOY_GUIDE_GUI.md`

---

## 0. อัปเดตสถาปัตยกรรม (v11) — web app ทำงานในตัวเอง

- **หน้า board query D1 ตรง ๆ** (server component + Drizzle) ไม่เรียก API worker แยกแล้ว
  → ตัด custom JWT / cross-worker cookie / CORS ทิ้งทั้งหมด
- Auth.js ใช้ config **มาตรฐาน** (ตัด custom jwt.encode/decode ที่ทำให้ error=Configuration)
- Worker `pm-platform-api` (Hono) กลายเป็น **optional** — web app ไม่พึ่งแล้ว
- Font: **Sarabun** ทั้งเว็บ, ขนาดเริ่มต้น 14px, placeholder เทาจาง (`globals.css` + next/font)

## 1. โครงสร้างสำคัญ

`apps/api` และ `apps/web` เป็นโปรเจกต์อิสระแยกกันสมบูรณ์ (ไม่มี workspace) ทั้งสองมี
`src/db/schema.ts` เป็นของตัวเอง — **ถ้าแก้ schema ต้องแก้ 2 จุดให้ตรงกัน**

## 2. ⚠️ Cloudflare Env Type (สำคัญมาก อ่านก่อนแก้โค้ด)

`apps/web/cloudflare-env.d.ts` ประกาศ global interface `CloudflareEnv` ด้วยมือ (แทนคำสั่ง
`wrangler types` ที่ต้องรัน CLI ซึ่งเราไม่ได้ใช้เพราะ deploy ผ่านหน้าเว็บล้วน)

**กฎสำคัญ:** `getCloudflareContext()` จาก `@opennextjs/cloudflare` จะ type ค่า `env` ที่คืนกลับมา
จาก global `CloudflareEnv` เสมอ **ไม่ใช่**จาก generic type parameter ที่ใส่ตอนเรียก เช่น
`getCloudflareContext<{ DB: ... }>()` — generic ตัวนั้นไปกำหนด type ของ `cf` (Cloudflare request
properties) ไม่ใช่ `env`

✅ วิธีเรียกที่ถูกต้อง (ไม่ต้องใส่ generic เลย):
```ts
const { env } = getCloudflareContext();
// env.DB, env.AUTH_SECRET ฯลฯ ได้ type ที่ถูกต้องจาก CloudflareEnv อัตโนมัติ
```

⚠️ **ถ้าเพิ่ม binding ใหม่** (KV, R2, D1 ตัวใหม่) ใน `wrangler.jsonc` ต้องเพิ่ม property ใน
`cloudflare-env.d.ts` ด้วยมือให้ตรงกันเสมอ ไม่งั้น TypeScript compile error ตอน build

## 3. Routing

| Path | หน้าที่ |
|---|---|
| `/login` | login ด้วย Google **หรือ** อีเมล+รหัสผ่าน (2 แท็บ ขนาดเท่ากัน) — สูงพอดี 100dvh ไม่มี scroll |
| `/` | Portal — สิทธิ์เดียว/ยังไม่ตั้งสิทธิ์ → redirect `/pm` ตรง; สิทธิ์หลายระบบ → แสดง portal |
| `/pm` | redirect ไป `/pm/board?id=1` |
| `/pm/board?id=:projectId` | Kanban Board — ใช้ query param แทน dynamic route `[projectId]` |
| `/api/debug` | **Diagnostic endpoint** — เช็ค D1 connectivity + secrets (ลบทิ้งหลัง debug เสร็จ) |

⚠️ Next.js 15 breaking change: `searchParams` และ `cookies()` เป็น async/Promise แล้ว
(Next 14 เป็น sync) — แก้ไว้แล้วใน `pm/board/page.tsx`

## 4. Local Email+Password Login

คอลัมน์ `password_hash` ในตาราง `users` — hash ด้วย PBKDF2-SHA256 ผ่าน Web Crypto
(`apps/web/src/lib/password.ts`) รูปแบบ: `"<iterations>:<saltHex>:<hashHex>"`

## 5. Favicon / Logo

`apps/web/src/app/{icon.png, apple-icon.png, favicon.ico}` — Next.js auto-detect เป็น favicon
`apps/web/public/rocket-logo.png` — ใช้ใน `<Image>` ที่หน้า login โดยตรง

## 6. Business Logic (`apps/api/src/lib/progress.ts`)

| Requirement | วิธีคำนวณ |
|---|---|
| Auto-Dates | `MIN(task.start_date)` / `MAX(task.due_date)` |
| Progress % | `count(done) / count(total)` |
| Actual Hours | `SUM(task_worklogs.hours_spent)` real-time |

## 7. Endpoint หลัก

| Method | Path |
|---|---|
| GET | `/api/projects` |
| **GET** | **`/api/projects/:id/board`** |
| PATCH | `/api/tasks/:id/status` |
| POST | `/api/tasks/:id/worklogs` |
