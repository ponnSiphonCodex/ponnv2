# คู่มืออัปเดต (v7) — เพิ่ม Local Login + Diagnostic Tool + แก้ UI

## สรุปสิ่งที่แก้ในรอบนี้

1. **เพิ่ม Local Email+Password login แบบสมบูรณ์** (ของเดิมยังไม่มี — เป็นสาเหตุที่แท็บ
   "อีเมล+รหัสผ่าน" ใช้งานไม่ได้เลยไม่ว่าจะพิมพ์อะไรก็ error)
2. **เพิ่ม `/api/debug`** — เปิด URL นี้ตรงในเบราว์เซอร์เพื่อเช็คว่า D1 database เชื่อมต่อได้จริงไหม
3. **แก้ข้อความ** "ระบบจะพาไปหน้าเลือกบัญชี Google ของคุณ" → "Login ก่อนใช้งาน หรือ ติดต่อ ponnsth@gmail.com"
4. **แก้ปุ่มให้ขนาดเท่ากัน** ทั้งแท็บ Google และแท็บ Local (ปุ่มสูง 48px เท่ากันเป๊ะ + content area สูงเท่ากัน กันการ์ดขยับตอนสลับแท็บ)

---

## STEP A — ทำไม Google Login กับ Local Login ถึง Error

### Local Login (อีเมล+รหัสผ่าน)
**สาเหตุ:** โค้ดเดิมไม่มีระบบนี้เลย — ไม่มีคอลัมน์เก็บรหัสผ่านใน database, ไม่มี logic ตรวจสอบรหัสผ่าน
เพราะ spec ตอนแรกระบุแค่ Google OAuth เท่านั้น พอมีคนพิมพ์อีเมล/รหัสผ่านแล้วกด submit ระบบเลย error
กลับมาตลอดเพราะไม่มีอะไรให้ตรวจสอบ

**แก้แล้ว:** เพิ่มคอลัมน์ `password_hash`, เพิ่ม Credentials provider ใน NextAuth, เพิ่มหน้าฟอร์ม
กรอกอีเมล/รหัสผ่านที่ใช้งานได้จริง

### Google Login
**สาเหตุที่เป็นไปได้ (เรียงจากพบบ่อยสุด):**
1. D1 binding ไม่ได้เชื่อมต่อจริง (env.DB เป็น undefined) → DrizzleAdapter สร้าง user ไม่ได้ →
   error
2. `AUTH_SECRET` ไม่ตรงกับที่ใช้ sign JWT ก่อนหน้า (ถ้าเคย login ด้วยค่าเก่าแล้วเปลี่ยน secret)
3. Google Console redirect URI ไม่ตรงกับโดเมนที่ deploy จริง

**วิธีเช็คให้ชัวร์ (ทำ STEP B ก่อน)** — ไม่ต้องเดา เปิด URL เดียวจะรู้ทันทีว่าปัญหาอยู่ตรงไหน

---

## STEP B — ใช้ `/api/debug` เช็ค D1 + Secrets (ทำก่อนอื่นเลย)

หลัง deploy โค้ดใหม่เสร็จ (ดู STEP D) ให้เปิด URL นี้ในเบราว์เซอร์:

```
https://<URL เว็บของคุณ>/api/debug
```

จะได้ผลลัพธ์แบบ JSON ประมาณนี้:

```json
{
  "env": {
    "DB_BOUND": true,
    "AUTH_SECRET_SET": true,
    "GOOGLE_CLIENT_ID_SET": true,
    "GOOGLE_CLIENT_SECRET_SET": true
  },
  "db": {
    "ok": true,
    "userCount": 0
  }
}
```

**อ่านผลลัพธ์:**

| ค่าที่เห็น | ความหมาย | ต้องทำอะไร |
|---|---|---|
| `DB_BOUND: false` | D1 ไม่ได้ผูกกับ Worker เลย | เข้า Cloudflare Dashboard → Worker `pm-platform-web` → Settings → Bindings → เช็คว่ามี D1 binding ชื่อ `DB` ชี้ไปที่ database `ponn_platform` |
| `db.ok: false` พร้อม error message | ผูก D1 ไว้แล้วแต่ query ไม่ได้ (เช่น table ไม่มีอยู่จริง) | อ่าน error message ตรง ๆ เช่นถ้าเจอ "no such table: users" แปลว่ายังไม่ได้รัน SQL migration หรือรันผิด database |
| `AUTH_SECRET_SET: false` | ยังไม่ได้ตั้ง secret นี้ | ตั้งผ่าน Settings → Variables and Secrets |
| ทุกค่าเป็น `true` และ `db.ok: true` | ระบบเชื่อมต่อ D1 สำเร็จแล้ว | ปัญหา Google Login (ถ้ายังไม่ได้) อยู่ที่ Google Console redirect URI แทน — เช็ค STEP C |

⚠️ **ลบไฟล์นี้ทิ้งหลัง debug เสร็จ** (`apps/web/src/app/api/debug/route.ts`) เพราะเปิดให้ใครก็ตาม
เข้าดูได้ว่า infrastructure ตั้งค่าอะไรไว้บ้าง (ไม่ปลอดภัยระยะยาว แม้จะไม่โชว์ค่า secret จริง)

---

## STEP C — เช็ค Google Console Redirect URI

1. เปิด [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. คลิก OAuth Client ที่ใช้อยู่
3. เช็ค **Authorized redirect URIs** ต้องมี URL ที่ตรงกับโดเมนจริงที่ deploy อยู่ **เป๊ะทุกตัวอักษร**
   รวม `https://` และ path `/api/auth/callback/google` เช่น:
   ```
   https://apix.ponnsth.com/api/auth/callback/google
   ```
   (แก้ตามโดเมนจริงของคุณ — ดูจาก URL ที่ตั้งใน `NEXT_PUBLIC_API_URL` หรือ URL จริงของ Worker เว็บ)

---

## STEP D — Deploy โค้ดใหม่ (ผ่าน GitHub Desktop เหมือนเดิม)

1. ดาวน์โหลด + แตกไฟล์ zip ใหม่ (ตั้งชื่อสั้นกันปัญหา path length เหมือนเดิม — แตกที่ `C:\pm3` หรือคล้ายกัน)
2. เปิด GitHub Desktop → repo `ponnv2` (ที่ clone ไว้แล้ว)
3. คัดลอกไฟล์ทั้งหมดจากโฟลเดอร์ที่แตกใหม่ → วางทับใน repo folder (`C:\ponnv2`) → ยืนยัน Replace
4. เช็คใน GitHub Desktop ว่าเห็นไฟล์ใหม่/แก้ไขครบ (โดยเฉพาะ `password.ts`, `api/debug/route.ts`,
   `login/page.tsx`, `schema.ts` ทั้ง 2 ไฟล์, SQL migration ใหม่)
5. Commit → Push

## STEP E — รัน SQL Migration เพิ่ม (สำคัญ ห้ามข้าม)

เปิดไฟล์ `database/migrations/0001_add_local_auth.sql` จากในเครื่อง → คัดลอกทั้งหมด → ไปที่
Cloudflare Dashboard → D1 → `ponn_platform` → **Console** → วาง → Ctrl+A ในกล่อง Query ก่อน →
**Run**

จะได้ local user ทดสอบ 1 คนทันที:
```
Email:    admin@ponnsth.com
Password: Ponnsth@2026
```

---

## STEP F — สร้าง Local User เพิ่ม (ถ้าต้องการ)

Password hash ต้องคำนวณด้วย PBKDF2-SHA256 ให้ตรง format `<iterations>:<saltHex>:<hashHex>`
วิธีสร้าง hash ใหม่แบบไม่ต้องใช้ terminal ของตัวเอง — บอก Copilot (ผม) ว่า:

> "ช่วย generate password hash สำหรับ local user ใหม่ email=xxx password=yyy"

จะได้ SQL `INSERT` พร้อมใช้กลับมาให้ทันที (ผมมีเครื่องมือรันโค้ดคำนวณ hash ให้ได้ตรง ๆ)

---

## STEP G — ทดสอบ

| # | ทำอะไร | ผลที่ควรได้ |
|---|---|---|
| 1 | เปิด `/api/debug` | `db.ok: true` ทุกค่า |
| 2 | เปิดหน้า `/login` | การ์ดพอดีจอ ไม่มี scroll, ปุ่มทั้ง 2 แท็บขนาดเท่ากัน |
| 3 | แท็บ "อีเมล + รหัสผ่าน" → กรอก `admin@ponnsth.com` / `Ponnsth@2026` | เข้าระบบสำเร็จ ไป `/pm/board?id=1` |
| 4 | แท็บ "บัญชี Google" → เลือกบัญชี | ถ้ายัง error ให้เช็ค STEP C (redirect URI) |

---

## Troubleshooting เพิ่มเติม

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| `/api/debug` เข้าไม่ได้ (404) | build ยังไม่เสร็จ หรือไฟล์ไม่ถูก push ขึ้นจริง | เช็คใน GitHub ว่ามีไฟล์ `apps/web/src/app/api/debug/route.ts` อยู่จริง |
| Local login ขึ้น "อีเมลหรือรหัสผ่านไม่ถูกต้อง" แม้พิมพ์ถูก | ยังไม่ได้รัน STEP E (SQL migration) หรือรันไม่ครบ | กลับไปรัน SQL ใหม่ เช็คด้วย `SELECT email, password_hash FROM users;` ใน D1 Console ว่ามีแถวนี้จริง |
| Google login ขึ้น `OAuthAccountNotLinked` | เคยสมัคร local password ด้วย email เดียวกันมาก่อน | ปกติ (กันบัญชีซ้ำโดยไม่ตั้งใจ) — ใช้วิธี login เดิมที่เคยใช้ |
