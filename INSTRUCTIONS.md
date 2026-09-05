# INSTRUCTIONS.md — Portfolio Workspace

> **วางไฟล์นี้ให้ AI อ่านก่อนเริ่มคุยรอบใหม่เสมอ** — สรุปทุกอย่างที่ต้องรู้เพื่อทำงานต่อได้ทันที
> ไม่ต้องอธิบายบริบทซ้ำใหม่ทั้งหมด

---

## 1. ภาพรวมระบบ

**Portfolio Workspace** — ระบบบริหารโครงการและพอร์ตองค์กร (Enterprise PM & Portfolio)
รองรับหลายโมดูล (Multi-Module) เริ่มจาก PM ก่อน แล้วต่อยอด Rentals และโมดูลอื่นในอนาคต

| รายการ | ค่า |
|---|---|
| เจ้าของระบบ | สิภณ สถิตโภควาณิช (ponnsiphon@gmail.com) |
| Domain หลัก | ponnsth.com |
| Web (Next.js) | `pm.ponnsth.com` → Worker `pm-platform-web` |
| API (Hono) | `apix.ponnsth.com` → Worker `pm-platform-api` |
| Database | Cloudflare D1 ชื่อ `ponn_platform` (ID: `940740b8-9177-489a-9344-47b3e61302f8`) |
| Repo | GitHub `ponnSiphonCodex/ponnv2` (private) |
| Deploy | Cloudflare Workers Builds (เชื่อม Git โดยตรง ไม่ใช้ CLI) |
| แก้โค้ด/push | ผ่าน **GitHub Desktop** เท่านั้น (ห้ามใช้เว็บ GitHub ลากไฟล์ — โฟลเดอร์ชื่อวงเล็บ `[...]` อัปโหลดผ่านเว็บไม่เสถียร) |

---

## 2. Tech Stack & Architecture

```
Browser
  │
  ▼
apps/web (Next.js 15, App Router)
  - Deploy: @opennextjs/cloudflare → Cloudflare Worker
  - Auth: Google OAuth2 (popup, access_token flow) + Email/Password
  - Session: JWT ใน cookie (ดูหัวข้อ 4)
  │  cookie: authjs.session-token (domain=.ponnsth.com ใช้ร่วมกันทุก subdomain)
  ▼
apps/api (Hono.js)
  - Deploy: wrangler ตรง → Cloudflare Worker
  - Business logic: Progress %, Auto-Dates, Actual Hours (ดู lib/progress.ts)
  ▼
Cloudflare D1 (SQLite ผ่าน Drizzle ORM)
```

**สำคัญ:** `apps/api` และ `apps/web` เป็นโปรเจกต์อิสระสมบูรณ์ในตัวเอง **ไม่ใช้ npm/pnpm
workspace** เพราะ Cloudflare Workers Builds ที่ตั้ง Root Directory แยกต่อ Worker จะ
install dependency แค่ในโฟลเดอร์นั้น resolve `workspace:*` ข้ามโฟลเดอร์ไม่ได้
(เจอ error "Workspace dependency not found" มาแล้ว) — schema.ts เลย **ก็อปปี้ไว้ 2 ที่**
(`apps/api/src/db/schema.ts` และ `apps/web/src/db/schema.ts`) **ต้องแก้พร้อมกันทั้งคู่เสมอ**

---

## 3. Deploy Workflow (ทำผ่านเว็บล้วน ไม่ใช้ Terminal)

1. แก้โค้ดในเครื่อง (รับไฟล์จาก AI เป็น .zip โครงสร้างตรงกับ repo)
2. ลากไฟล์ทับโฟลเดอร์ repo ที่ clone ไว้ (ผ่าน **GitHub Desktop**)
3. Commit → Push
4. Cloudflare Workers Builds จับ commit ใหม่ → build + deploy อัตโนมัติทั้ง 2 Worker

**Root Directory ของแต่ละ Worker (ตั้งครั้งเดียวตอนเชื่อม repo):**
- `pm-platform-api` → Root directory = `apps/api`, Build command = ว่าง
- `pm-platform-web` → Root directory = `apps/web`, Build command = `npm run build:worker`

**Secrets ที่ต้องตั้งผ่าน Cloudflare Dashboard (ไม่เก็บในโค้ด):**
| Worker | ตัวแปร |
|---|---|
| ทั้งคู่ | `AUTH_SECRET` (ต้องเป็นค่าเดียวกันเป๊ะทั้ง 2 Worker) |
| ทั้งคู่ | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| pm-platform-web เท่านั้น | `NEXT_PUBLIC_API_URL` = `https://apix.ponnsth.com` |

**Database migration:** รันผ่าน D1 Dashboard → Console เท่านั้น (ไม่มี CLI)
ไฟล์ล่าสุด (idempotent รันซ้ำได้ปลอดภัย): `database/migrations/0000_init_idempotent.sql`

⚠️ **ก่อนรัน SQL ทุกครั้ง** เช็คว่า Worker ผูกกับ D1 database ตัวเดียวกับที่เปิด
Console อยู่จริง (Worker → Settings → Bindings) — เคยเจอปัญหา "no such table" เพราะ
รัน SQL คนละฐานข้อมูลกับที่ Worker ใช้จริง

---

## 4. Authentication & Session Policy

| หัวข้อ | รายละเอียด |
|---|---|
| Google Login | OAuth2 popup (`initTokenClient` + `prompt:'select_account'`) — บังคับเปิดหน้าเลือกบัญชีทุกครั้ง ไม่ auto-select บัญชีที่ browser จำไว้ |
| Email/Password | Hash ด้วย Web Crypto PBKDF2-SHA256 (100,000 รอบ) — ดู `apps/web/src/lib/password.ts` |
| Session อยู่ได้นานแค่ไหน | ตั้งใจให้ "อยู่ตลอดไป" — cookie maxAge = 10 ปี |
| Logout อัตโนมัติเมื่อไหร่ | เมื่อ deploy เวอร์ชันใหม่ที่ขยับเลข `APP_VERSION` (ดูข้อ 5) — เช็คจาก claim `ver` ใน JWT ไม่ตรงกับเวอร์ชันที่รันอยู่ = บังคับ login ใหม่ |
| ใช้ข้ามโดเมนย่อยได้ไหม | ได้ — cookie ตั้ง `domain=.ponnsth.com` login ที่ไหนใน `*.ponnsth.com` ใช้ร่วมกันได้หมด |
| Setup รหัสผ่านคนแรก | เข้า `/setup` (ต้องรู้ค่า `AUTH_SECRET`) หรือ seed ตรงผ่าน SQL (ดูข้อ 6) |

**ไฟล์ที่เกี่ยวข้อง:**
- `apps/web/src/lib/auth.ts` — `signSessionToken()`, `getCookieDomain()`, ค่าคงที่ `SESSION_MAX_AGE_SECONDS`
- `apps/web/src/app/api/auth/google/route.ts` — verify Google token ฝั่ง server เสมอ (ไม่เชื่อ client)
- `apps/web/src/app/api/auth/login/route.ts` — email+password
- `apps/api/src/middleware/auth.ts` — verify JWT ฝั่ง API + เช็ค version claim

---

## 5. Version Policy (สำคัญมาก)

`apps/web/src/version.ts` และ `apps/api/src/version.ts` ต้องมีค่า `APP_VERSION` **ตรงกันเป๊ะเสมอ**

ทุกครั้งที่ deploy แล้วต้องการบังคับให้ทุกคน login ใหม่ (แก้ auth logic, เปลี่ยนโครงสร้างสิทธิ์
ฯลฯ) ให้ขยับเลขนี้ขึ้นพร้อมกันทั้ง 2 ไฟล์ — ถ้าลืมขยับ session เก่าจะยังใช้งานได้ต่อ (ปกติ)
ถ้าขยับแต่ไฟล์เดียว ระบบจะ error ตลอด (เช็คแล้วไม่ตรงกัน)

---

## 6. บัญชี Admin เริ่มต้น

```
Email:    ponnsiphon@gmail.com
Password: pn2811qp
สิทธิ์:    System Admin (module GLOBAL) + PMO (module PM)
```

Seed ผ่าน `database/migrations/0000_init_idempotent.sql` (ท้ายไฟล์) — รันซ้ำได้ปลอดภัย
ไม่สร้างซ้ำ ถ้า login ด้วย Google ก่อนแล้วอยากตั้งรหัสผ่านทีหลัง ใช้ `/setup` แทน

---

## 7. Branding

- ชื่อระบบ: **Portfolio Workspace**
- โลโก้: จรวด (rocket) — component ที่ `apps/web/src/components/RocketLogo.tsx`
- Favicon: `apps/web/src/app/icon.svg` (Next.js App Router auto-detect)
- Font: TH Sarabun ทั้งเว็บ (โหลดจาก Google Fonts ใน `layout.tsx`)
- Theme สี (Viriyah CI):
  - Primary Navy `#001D58`
  - Accent Pink `#EC186E`
  - Neutral: `#FFFFFF` `#F4F4F6` `#E5E7EB` `#6B7280` `#1F2937`

---

## 8. UI/UX Master Framework (บังคับใช้ทุกงานถัดไป)

### โครงสร้างโฟลเดอร์ (จะทยอยปรับ apps/web ให้เข้ากรอบนี้)
- `src/components/` — Reusable components
- `src/components/icons.tsx` — รวม SVG icons ทั้งหมด
- `src/pages/` หรือ `src/app/` (Next.js ใช้ App Router) — 1 ไฟล์ต่อ 1 หน้าจอ
- `src/hooks/` — Custom hooks ดึงข้อมูลจาก API เท่านั้น ห้ามเขียน fetch ปนใน UI component
- `src/lib/` — ฟังก์ชันกลาง (format, notify ฯลฯ)
- `src/context/` — Global state (Auth, Theme)

### กฎสี (Semantic Colors)
ห้าม hardcode สีในโค้ด component — อ้างอิงจากธีมเสมอ
- Primary = Navy `#001D58` (ปุ่มหลัก/CTA)
- Success = เขียว (บันทึกสำเร็จ, ชำระเงินแล้ว)
- Warning = เหลือง/ส้ม (รอตรวจสอบ, ใกล้หมดอายุ)
- Danger = แดง (ลบ, ยกเลิก, error)
- Neutral = เทา (ข้อความทั่วไป, border, background)

### ตาราง (Table Standards)
- หุ้มด้วย `overflow-x-auto` เสมอ (เลื่อนได้บนมือถือ)
- Header ตัวหนา พื้นหลังเข้มกว่าตัวตาราง, sticky top ถ้าตารางยาว
- Zebra-striping หรือ hover effect
- คอลัมน์ action อยู่ขวาสุด ใช้ icon แทนข้อความยาว
- ไม่มีข้อมูล = แสดง Empty State (ข้อความ + icon กลางตาราง) ห้ามปล่อยตารางว่าง

### Loading States
- Initial load = Skeleton (animate-pulse) ไม่ใช้ spinner หมุนกลางจอ
- Action load (submit/save) = ปุ่ม disabled ทันที + spinner เล็กในปุ่ม หรือเปลี่ยนข้อความเป็น "กำลังบันทึก..."
- Background sync = progress bar เส้นเล็กบนขอบบนสุด ไม่รบกวนการใช้งาน

### Notifications/Toast
- ผ่านโมดูลกลาง `notify.js` เท่านั้น
- ตำแหน่ง: มุมขวาบน หรือล่างกลาง, z-index สูง
- Success=เขียว, Error=แดง (ข้อความอ่านง่าย ไม่มี technical jargon), Info=ฟ้า
- Auto-dismiss 3-5 วิ, hover หยุดนับเวลา, มีปุ่มกากบาทปิดเอง

### กระบวนการคิดก่อนสร้างฟีเจอร์ใหม่ (บังคับ)
ทุกครั้งที่สั่งสร้างหน้าจอ/ฟังก์ชันใหม่ ต้องตอบ 5 ข้อนี้ก่อนเขียนโค้ด รอ approve ก่อนเสมอ:
1. **User Goal** — ผู้ใช้เข้ามาทำอะไร
2. **User Flow** — เห็นอะไร → โต้ตอบยังไง → UI เปลี่ยนยังไงระหว่างรอ/หลังเสร็จ
3. **Data Requirements** — Endpoint ไหน, JSON หน้าตาอย่างไร, กระทบตารางไหนใน D1
4. **State Management** — ต้องใช้ state/context ตัวไหน
5. **Edge Cases** — Empty state, form validation error, API 500 error รับมือยังไง

### ข้อความ/Copy บน UI
ห้ามมีคำที่ทำให้รู้สึกว่าเป็นข้อความจาก AI (เช่น อธิบายเกินจำเป็น, ใช้ศัพท์เทคนิคตรงๆ,
คำนำ/คำลงท้ายแบบ chatbot) — เขียนให้เหมือนระบบ production จริงที่บริษัทพัฒนาเอง

---

## 9. ปัญหาที่เคยเจอ + วิธีแก้ (กันเจอซ้ำ)

| ปัญหา | สาเหตุ | วิธีแก้ที่ใช้ |
|---|---|---|
| `Workspace dependency not found` | ใช้ pnpm workspace ข้าม Root Directory | เลิกใช้ workspace, ก็อปปี้ schema.ts 2 ที่ |
| ไฟล์ในโฟลเดอร์ `[...]` หายตอนอัปโหลด | ลากไฟล์ผ่านเว็บ GitHub ไม่เสถียรกับโฟลเดอร์ชื่อวงเล็บ | ใช้ GitHub Desktop แทนเว็บ |
| `Next.js version ... not supported` | ใช้ Next.js 14 (EOL) | อัปเกรดเป็น Next.js 15 |
| `getCloudflareContext called in sync mode` ตอน build | หน้าถูก prerender เป็น static | เพิ่ม `export const dynamic = "force-dynamic"` ทุกหน้าที่เรียก Cloudflare context |
| `no such table: users` | Worker ผูก D1 คนละตัวกับที่รัน SQL หรือ SQL รันไม่ครบ (ไม่ idempotent, error กลางทางแล้วตารางขาด) | เช็ค Bindings ให้ตรง + ใช้ SQL แบบ `IF NOT EXISTS` เสมอ |
| Login error กว้าง ๆ ไม่รู้สาเหตุ | route throw error หลุดไม่ถูก catch, Cloudflare คืน HTML แทน JSON | ห่อ try/catch ทุก route คืน JSON เสมอ + แปล error เป็นภาษาคนอ่านง่าย (`lib/error-messages.ts`) |
| ปุ่ม Google โชว์ "ลงชื่อเข้าใช้เป็น [ชื่อ]" ไม่ต้องการ | ใช้ GIS ID-token button (`renderButton`) ที่ auto-detect บัญชีที่ browser จำไว้ | เปลี่ยนเป็น OAuth2 popup (`initTokenClient` + `prompt:'select_account'`) |

---

## 10. สิ่งที่ยังไม่ได้ทำ (Backlog)

- ปรับ `apps/web` ให้เข้ากรอบโครงสร้างเต็มรูปแบบตามข้อ 8 (ตอนนี้ยังเป็นไฟล์เดี่ยว inline style)
- Custom Fields UI, Role/Permission enforcement จริงระดับ route
- หน้า Project List / Portfolio Overview จริง (ตอนนี้ `/pm` redirect ตรงไป board id=1)
- Rentals module tables (คนละระบบ แยก repo/database ปัจจุบัน)
- Toast notification system กลาง (`notify.js`) — ตอนนี้ error แสดงแบบ inline บนฟอร์มเท่านั้น
