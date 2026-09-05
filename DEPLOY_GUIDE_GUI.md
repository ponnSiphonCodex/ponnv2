# คู่มืออัปเดต (v9) — แก้ Type Error "Property 'DB' does not exist on type 'CloudflareEnv'"

## 🔴 Root cause ของ error ล่าสุด

Build log แสดง:
```
Type error: Property 'DB' does not exist on type 'CloudflareEnv'.
```

**สาเหตุ:** โค้ดรอบก่อนเขียนเรียก `getCloudflareContext<{ DB: D1Database; ... }>()` โดยเข้าใจผิดว่า
generic type parameter ตรงนั้นจะกำหนด type ให้ `env` — แต่จริง ๆ แล้ว `env` ของ
`@opennextjs/cloudflare` type มาจาก **global interface ชื่อ `CloudflareEnv`** เสมอ (ปกติต้อง
generate ด้วยคำสั่ง `wrangler types` ผ่าน CLI ซึ่งเราไม่ได้ใช้เพราะ deploy ผ่านเว็บล้วน) พอไม่มีใคร
เคยประกาศ `CloudflareEnv` ไว้เลย TypeScript เลยมองว่ามันว่างเปล่า ไม่มี property `DB`

**วิธีแก้ในโค้ดชุดนี้:** เพิ่มไฟล์ `apps/web/cloudflare-env.d.ts` ประกาศ interface นี้ด้วยมือ
+ แก้ทั้ง 3 ไฟล์ที่เคยเรียก `getCloudflareContext<{...}>()` ผิด ให้เรียกแบบไม่มี generic:
```ts
const { env } = getCloudflareContext();
```

ไฟล์ที่แก้: `page.tsx` (root), `api/auth/[...nextauth]/route.ts`, `api/debug/route.ts`

---

## STEP A — Deploy โค้ดชุดนี้ (ผ่าน GitHub Desktop)

1. ดาวน์โหลด + แตกไฟล์ zip ใหม่ (ตั้งชื่อสั้นกันปัญหา path length เหมือนเดิม)
2. เปิด GitHub Desktop → repo ที่ clone ไว้
3. คัดลอกไฟล์ทั้งหมดจากโฟลเดอร์ที่แตกใหม่ → วางทับใน repo folder → ยืนยัน Replace
4. **สำคัญ:** เช็คใน GitHub Desktop ว่าเห็นไฟล์ใหม่ `apps/web/cloudflare-env.d.ts` ขึ้นเป็น "Added"
   (ถ้าไม่เห็นไฟล์นี้ในลิสต์ = ไม่ได้คัดลอกไปวางถูกที่ ต้องกลับไปทำ STEP 3 ใหม่)
5. Commit → Push

## STEP B — เช็คว่าไม่มีไฟล์เก่าค้างอยู่อีก

จากรอบก่อนเคยเจอไฟล์ `api/auth/google/route.ts` และ `api/auth/login/route.ts` ค้างอยู่ (ไม่ใช่
ไฟล์ของผม) — เช็คอีกครั้งว่าไฟล์ 2 ตัวนี้ถูกลบออกจาก repo แล้วจริง ๆ:

1. เข้า repo บนเว็บ GitHub → ไปที่ `apps/web/src/app/api/auth/`
2. ควรเห็นแค่โฟลเดอร์ `[...nextauth]` เท่านั้น (ไม่มี `google/` หรือ `login/` หลงเหลือ)
3. ถ้ายังเห็น ให้ลบทิ้งอีกครั้ง (คลิกไฟล์ข้างใน → ถังขยะ → Commit)

## STEP C — Retry Build

รอ auto-deploy หรือกด Retry build ที่ Cloudflare Dashboard → Worker `pm-platform-web`

## STEP D — เช็คด้วย `/api/debug`

หลัง build ผ่านแล้ว เปิด:
```
https://<URL เว็บของคุณ>/api/debug
```

ควรได้:
```json
{
  "env": { "DB_BOUND": true, "AUTH_SECRET_SET": true, "GOOGLE_CLIENT_ID_SET": true, "GOOGLE_CLIENT_SECRET_SET": true },
  "db": { "ok": true, "userCount": 0 }
}
```

ถ้า `db.ok: false` อ่าน error message ที่ได้มา (มักเป็น "no such table" ถ้ายังไม่รัน SQL migration)

## STEP E — รัน SQL (ไฟล์เดียวจบ)

SQL รวมเป็นไฟล์เดียวแล้วที่ `database/migrations/schema.sql` (สร้างครบ 23 ตาราง +
ใส่ local user ทดสอบในไฟล์เดียว ไม่ต้องสลับไฟล์)

**ขั้นตอน:**
1. เปิดไฟล์ `database/migrations/schema.sql` จากในเครื่อง (คลิกขวา → Open with → Notepad)
2. กด **Ctrl+A** แล้ว **Ctrl+C** (คัดลอกทั้งหมด)
3. ไปที่ Cloudflare Dashboard → D1 → `ponn_platform` → **Console**
4. คลิกในกล่อง Query → **Ctrl+A** (เลือกของเดิมที่อาจค้างอยู่) → **Ctrl+V** (วางทับ)
5. **สำคัญที่สุด:** กด **Ctrl+A** อีกครั้ง **ในกล่อง Query** (เพื่อเลือกทุกบรรทัดที่เพิ่งวางเข้าไป
   ทั้งหมด — ไม่งั้นระบบจะรันแค่บรรทัดที่ cursor อยู่บรรทัดเดียว ทำให้เจอ error "no such table")
6. กด **Run**
7. ต้องเห็นข้อความ **"Executed 24/24"** (หรือใกล้เคียง ไม่ใช่ "1/1")

⚠️ **ถ้าเจอ error "table users already exists"** แปลว่าเคยรันไฟล์นี้ (หรือไฟล์เก่า) ไปแล้วบางส่วน
ให้เช็คก่อนด้วยคำสั่งนี้ว่ามีตารางอะไรอยู่บ้าง:
```sql
SELECT name FROM sqlite_master WHERE type='table';
```
ถ้าเห็นตารางครบ 23 ตัวแล้ว (users, projects, tasks, ...) แปลว่าสร้างสำเร็จแล้ว ข้าม STEP นี้ได้เลย
ไปเช็คแค่ว่ามี local user ทดสอบหรือยังด้วย:
```sql
SELECT email, password_hash FROM users;
```

ได้ local user ทดสอบ:
```
Email:    admin@ponnsth.com
Password: Ponnsth@2026
```

## STEP F — ทดสอบ

| # | ทำอะไร | ผลที่ควรได้ |
|---|---|---|
| 1 | `/api/debug` | ทุกค่า true, `db.ok: true` |
| 2 | `/login` | การ์ดพอดีจอ ไม่ scroll, ปุ่ม 2 แท็บขนาดเท่ากัน |
| 3 | Local login: `admin@ponnsth.com` / `Ponnsth@2026` | เข้าสำเร็จ → `/pm/board?id=1` |
| 4 | Google login | ถ้ายัง error เช็ค redirect URI ใน Google Console ให้ตรงโดเมนจริง |

---

## Troubleshooting

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `Property 'DB' does not exist on type 'CloudflareEnv'` (ซ้ำอีก) | ไฟล์ `cloudflare-env.d.ts` ไม่ถูก push ขึ้นจริง | เช็คใน GitHub ว่ามีไฟล์นี้อยู่ที่ `apps/web/cloudflare-env.d.ts` (root ของ apps/web ไม่ใช่ใน src/) |
| Local login ขึ้น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ตลอด | ยังไม่รัน SQL (STEP E) | รันแล้วเช็คด้วย `SELECT email, password_hash FROM users;` ใน D1 Console |
| `Error: no such table: users` | ตารางยังไม่ถูกสร้างเลย (รันแค่ INSERT โดยไม่มีตารางรองรับ) มักเพราะกด Run โดยเลือกแค่บรรทัดเดียว | เปิด `schema.sql` → Ctrl+A ทั้งไฟล์ → วางในกล่อง Query → **Ctrl+A ในกล่อง Query อีกครั้ง** ก่อน Run — ต้องเห็น "Executed 24/24" ไม่ใช่ "1/1" |
| `/api/debug` ขึ้น 404 | build ยังไม่เสร็จ หรือไฟล์ไม่ถูก push | เช็คว่ามีไฟล์ `apps/web/src/app/api/debug/route.ts` ใน repo จริง |
