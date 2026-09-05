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

## STEP E — รัน SQL Migration (ถ้ายังไม่เคยทำ)

**กรณี A — สร้าง D1 database ใหม่ (ยังไม่เคยรัน SQL อะไรเลย):**
รันแค่ `database/migrations/0000_init.sql` (มีคอลัมน์ `password_hash` รวมอยู่แล้ว) ตามด้วย
`0002_seed_local_user.sql` (insert local user ทดสอบ)

**กรณี B — เคยรัน 0000_init.sql เวอร์ชันเก่าไปแล้ว (ไม่มีคอลัมน์ password_hash):**
รัน `database/migrations/0001_add_local_auth.sql` แทน (มี ALTER TABLE + insert user ในตัวเดียว)

ทั้งสองกรณี ทำผ่าน Cloudflare Dashboard → D1 → `ponn_platform` → Console → วาง SQL →
Ctrl+A ในกล่อง Query ก่อน Run

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
| Local login ขึ้น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" ตลอด | ยังไม่รัน SQL migration (STEP E) | รันแล้วเช็คด้วย `SELECT email, password_hash FROM users;` ใน D1 Console |
| `/api/debug` ขึ้น 404 | build ยังไม่เสร็จ หรือไฟล์ไม่ถูก push | เช็คว่ามีไฟล์ `apps/web/src/app/api/debug/route.ts` ใน repo จริง |
