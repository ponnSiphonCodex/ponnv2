# Portfolio Workspace (PM Platform) — Instruction & Handoff

> เอกสารสรุปทุกอย่างที่ทำมา สำหรับเริ่มแชทใหม่ต่อได้ทันที
> โปรเจกต์: ระบบ PM & Portfolio บน Cloudflare (D1 + Workers) ที่ `pm.ponnsth.com`

---

## 1. Tech Stack (สรุป)

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend + Backend | **Next.js 15** (App Router) รันบน **Cloudflare Workers** ผ่าน **@opennextjs/cloudflare** |
| Database | **Cloudflare D1** (SQLite) |
| ORM | **Drizzle ORM** (sqlite-core) |
| Auth | **เขียนเอง** (ไม่ใช้ NextAuth) — session cookie + HMAC-SHA256 + Google OAuth manual |
| Deploy | GitHub → Cloudflare Workers Builds (auto build on push) |
| File Upload | Google Drive ผ่าน Google Apps Script |

> ⚠️ **ไม่มี API worker แยก (Hono) แล้ว** — web app query D1 ตรงในตัวเอง

---

## 2. ประวัติปัญหาที่แก้มา (สำคัญ — อ่านก่อนแก้ต่อ)

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| Build fail: workspace not found | ใช้ monorepo `packages/db` + `workspace:*` | ยุบเหลือ app เดียว query D1 ตรง ไม่มี workspace |
| Build fail: Next 14 EOL | OpenNext block Next 14 | อัปเป็น Next 15 |
| Build fail: path length | Windows แตก zip path ยาว >260 ตัด folder ทิ้ง | ตั้งชื่อ zip สั้น + แตกที่ `C:\pm` |
| Build fail: searchParams sync | Next 15 เปลี่ยนเป็น async | `await searchParams` / `await cookies()` |
| Build fail: CloudflareEnv type | generic ผิด | เพิ่ม `cloudflare-env.d.ts` + `ignoreBuildErrors` |
| Login: error=Configuration | NextAuth v5 beta พังบน Cloudflare | **ทิ้ง NextAuth เขียน auth เอง** |
| Login: secrets = false | ตั้งเป็น "Variable" ใน Dashboard → `wrangler deploy` ลบทิ้ง | ตั้งเป็น **Secret** (encrypted) หรือ Environment Variable |
| Favicon ไม่ขึ้น | v16 ย้าย icon ไป public/ ชนกัน | **กลับไป v15: icon อยู่ใน `app/`** ให้ Next auto-detect |
| no such table | `PRAGMA` บรรทัดแรก D1 รันไม่ได้ ทำ batch ล้ม | ตัด PRAGMA ออก |

---

## 3. โครงสร้างไฟล์

```
pm/
├── apps/web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── icon.png, favicon.ico, apple-icon.png  ← favicon (Next auto-detect)
│   │   │   ├── layout.tsx, globals.css, page.tsx (→ /pm/dashboard)
│   │   │   ├── login/page.tsx                          ← 2 แท็บ Google/Local
│   │   │   ├── pm/
│   │   │   │   ├── dashboard/page.tsx                  ← สถิติ + โครงการล่าสุด
│   │   │   │   ├── board/page.tsx                      ← Kanban (?id=1)
│   │   │   │   ├── projects/page.tsx                   ← ตารางโครงการ
│   │   │   │   ├── team/page.tsx                       ← จัดการ role (admin)
│   │   │   │   └── settings/page.tsx                   ← upload + info (admin)
│   │   │   └── api/
│   │   │       ├── login/route.ts                      ← POST verify password
│   │   │       ├── logout/route.ts
│   │   │       ├── auth/google/route.ts                ← เริ่ม OAuth
│   │   │       ├── auth/callback/google/route.ts       ← callback (มี debug detail)
│   │   │       ├── debug/route.ts                      ← เช็ค env + redirect_uri
│   │   │       ├── users/route.ts                      ← list users+roles (admin)
│   │   │       └── user-roles/route.ts                 ← add/remove role (admin)
│   │   ├── components/
│   │   │   ├── app-shell.tsx                           ← Sidebar Hamburger (collapse)
│   │   │   ├── team-manager.tsx                        ← UI จัดการ role
│   │   │   └── file-upload.tsx
│   │   ├── db/{schema,client,index}.ts                 ← Drizzle schema
│   │   ├── lib/
│   │   │   ├── session.ts        ← HMAC token create/verify
│   │   │   ├── password.ts       ← PBKDF2 hash/verify
│   │   │   ├── current-user.ts   ← อ่าน session จาก cookie
│   │   │   ├── rbac.ts           ← getRolesForUser, isAdmin
│   │   │   ├── page-auth.ts      ← requireAuth() (ใช้ทุกหน้า)
│   │   │   ├── board-data.ts     ← query kanban + list projects
│   │   │   └── upload.ts         ← อัปโหลด Google Drive
│   │   └── middleware.ts         ← เช็ค cookie มีไหม (เบา)
│   ├── public/rocket-logo.png    ← โลโก้หน้า login
│   ├── wrangler.jsonc            ← D1 binding (ไม่มี secrets)
│   ├── next.config.js, tsconfig.json, package.json
│   └── cloudflare-env.d.ts
├── database/migrations/schema.sql ← สร้างตาราง + seed (รันใน D1 Console)
├── google-apps-script/Code.gs
└── Instruction.md (ไฟล์นี้)
```

---

## 4. Auth ที่เขียนเอง (แทน NextAuth)

**หลักการ:** session = signed cookie ชื่อ `session` = `base64url(payload).base64url(HMAC-SHA256)`

- **Local login:** `POST /api/login {email,password}` → verify PBKDF2 → set cookie
- **Google login:** `/api/auth/google` → Google consent → `/api/auth/callback/google` →
  แลก code เป็น token → ดึง profile → upsert user → set cookie
- **เช็คในหน้า:** `requireAuth()` (lib/page-auth.ts) อ่าน cookie + verify + โหลด roles

**Session payload:** `{ sub: userId, email, name, exp }`

---

## 5. RBAC (Role-Based Access Control)

- ตาราง `system_roles` (Admin=GLOBAL, PMO/PM/Member=PM) + `user_roles` (mapping)
- **Admin** = มี role `Admin` หรือ module `GLOBAL` → เห็นทุกเมนู (team, settings)
- เมนู `team` + `settings` = admin-only (ซ่อนใน sidebar + redirect ถ้าเข้าตรง)
- **จัดการ role:** หน้า `/pm/team` (admin) กดปุ่ม role เพื่อ add/remove ให้ user คนไหนก็ได้

---

## 6. บัญชีทดสอบ (seed มาให้แล้ว)

| Email | Password | Roles |
|---|---|---|
| `admin@ponnsth.com` | `Ponnsth@2026` | Admin |
| `ponnsiphon@gmail.com` | `pn2811qp` | **Admin + PMO** |
| somchai@viriyah.co.th | (ไม่มี — สำหรับทดสอบ assign role) | PM |
| suda@viriyah.co.th | — | Member |
| nattapong@viriyah.co.th | — | Member |

**Sample data:** 5 projects, 6 tasks, 5 worklogs, 2 themes (board id=1 มีข้อมูลจริง)

---

## 7. Environment / Secrets

ตั้งใน **Cloudflare Dashboard → Worker `pm-platform-web` → Settings → Variables and Secrets**
(ต้องเป็น **Secret/encrypted** ไม่ใช่ Variable ธรรมดา ไม่งั้น `wrangler deploy` ลบทิ้ง):

| ชื่อ | ค่า |
|---|---|
| `AUTH_SECRET` | สุ่ม 32+ ตัวอักษร (ใช้ sign session) |
| `GOOGLE_CLIENT_ID` | `71834421978-cuhvt0kbulcki1e8q4e1d7pmt1kq8sk6.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | จาก Google Console (ดูข้อ 8) |

Database Runtime: Supabase Data API ผ่าน HTTPS ไม่มี D1 binding

**เช็คว่าครบ:** เปิด `/api/debug` ต้องได้ true ทั้ง 4 + `db.ok:true`

---

## 8. ⚠️ Google Login ยังไม่ผ่าน — วิธี Debug (สำคัญ)

**v18 เพิ่ม debug detail แล้ว** — เวลา login Google fail จะ redirect กลับพร้อม
`?error=OAuthSignin&detail=<error จริงจาก Google>` และหน้า login จะโชว์ "รายละเอียด: ..."

**ขั้นตอน debug:**
1. กดปุ่ม Google login → พออ fail ดูข้อความ "รายละเอียด:" บนหน้า login
2. แปลผล:
   - `token 401: {"error":"invalid_client"}` → **GOOGLE_CLIENT_SECRET ผิด/โดน reset** → เอาค่าใหม่จาก Google Console มาใส่
   - `token 400: {"error":"redirect_uri_mismatch"}` → redirect_uri ไม่ตรง (ดูข้อ 3 ล่าง)
   - `token 400: {"error":"invalid_grant"}` → code หมดอายุ ลองใหม่
3. เปิด `/api/debug` ดู `REDIRECT_URI_USED` — ค่านี้ต้องมีเป๊ะใน
   [Google Console](https://console.cloud.google.com/apis/credentials) → OAuth Client →
   **Authorized redirect URIs** (ปกติคือ `https://pm.ponnsth.com/api/auth/callback/google`)
4. เทียบ `GOOGLE_CLIENT_ID_PREVIEW` ใน /api/debug กับ client_id จริงใน Console ว่าตรงไหม

**สาเหตุที่เป็นไปได้มากสุด:** Client Secret ถูก Reset (ตอนแรกเตือนให้ reset เพราะหลุด)
→ ต้องเอา secret ปัจจุบันจาก Google Console มาใส่ใน Cloudflare

---

## 9. Deploy (ทำทุกครั้งที่แก้โค้ด)

1. **GitHub Desktop** → repo `ponnv2`
2. ลบไฟล์เก่าในโฟลเดอร์ทิ้ง (ยกเว้น `.git`) → วางไฟล์จาก zip ใหม่
3. Commit → Push → Cloudflare build อัตโนมัติ (~3-5 นาที)
4. รัน `database/migrations/schema.sql` ใน D1 Console (ครั้งแรก/เมื่อ schema เปลี่ยน)
   - เปิดไฟล์ → Ctrl+A copy → วางใน Console → **Ctrl+A ในกล่อง Query** → Run

---

## 10. สิ่งที่ยังทำต่อได้ (TODO)

- Google login (แก้ตามข้อ 8)
- CRUD tasks/projects จริง (ตอนนี้ read-only)
- Drag & drop kanban
- Custom fields UI
- Rentals module (schema เผื่อไว้แล้ว)
- ย้าย secrets จาก env ไป Cloudflare Secret แบบ encrypted (ความปลอดภัย)

---

## 11. คำสั่ง/ค่าที่ใช้บ่อย

```
Database: Supabase Data API ผ่าน HTTPS
Worker: pm-platform-web
Domain: pm.ponnsth.com
Repo: github.com/ponnSiphonCodex/ponnv2
Drive upload (Apps Script): https://script.google.com/macros/s/AKfycby.../exec
```

**Theme สี:** Navy `#001D58` (primary) · Pink `#EC186E` (accent) · พื้นขาว · font Sarabun 15px

---

## 12. อัปเดต v19

### Global Loading Overlay
- `components/loading-overlay.tsx` — ไอคอน animated (heartbeat line) + เบลอพื้นหลัง + block การกด
- `<RouteLoadingOverlay />` ใน layout → โผล่อัตโนมัติตอนเปลี่ยนหน้า (ดักคลิก `<a>` ภายใน)
- `<LoadingOverlay show={} label="" />` ใช้ที่: login (submit), team (update role), file-upload
- ไอคอนใช้ SVG polyline heartbeat จาก stroke-dasharray animation

### ⚠️ Worker pm-platform-api build fail — ไม่กระทบเว็บ
`root directory not found` = Worker เก่า `pm-platform-api` ยังตั้ง root=`apps/api` แต่ลบไปแล้ว
→ **ลบ Worker `pm-platform-api` ทิ้ง** (Dashboard → Workers → pm-platform-api → Delete)
เว็บจริงคือ `pm-platform-web` ที่ทำงานปกติ
