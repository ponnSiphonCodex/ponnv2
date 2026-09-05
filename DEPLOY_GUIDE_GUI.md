# คู่มือ (v11) — แก้ Login Configuration Error + Font Sarabun

## 🎯 รอบนี้แก้อะไร (สำคัญ อ่านก่อน)

### 1. Login ไม่ได้ทั้ง Google + Local (error=Configuration)
**สาเหตุ:** custom `jwt.encode/decode` ที่เคยใส่ไว้ (เพื่อให้ API worker แยกตัวมา verify token)
เป็น config ไม่มาตรฐาน → Auth.js init ไม่สำเร็จ → ล้มทั้ง 2 วิธีพร้อมกัน

**แก้แบบรื้อสถาปัตยกรรมให้เรียบง่ายลง (จบปัญหาถาวร):**
- ตัด custom jwt encode/decode ออก → ใช้ Auth.js มาตรฐาน
- **หน้า board query ฐานข้อมูล D1 ตรง ๆ ในตัวเอง** ไม่เรียก API worker แยกอีกต่อไป
  → ตัดปัญหา cross-worker cookie / CORS / custom JWT ทั้งหมดในครั้งเดียว
- ผลลัพธ์: **web app ทำงานได้ในตัวเอง ไม่ต้องพึ่ง API worker เลย**

### 2. Font
- ใช้ **Sarabun** ทั้งเว็บ (โหลดผ่าน next/font self-host อัตโนมัติ)
- ขนาดเริ่มต้น **14px**
- placeholder / hint ใน text box = **สีเทาจางมาก** (`#c7ccd4`)

---

## ⚠️ เรื่อง API Worker (pm-platform-api)

หลังแก้รอบนี้ **web app ไม่เรียก API worker แล้ว** — Worker `pm-platform-api` ที่เคย deploy ไว้
จะ**ไม่ถูกใช้งาน** (ปล่อยทิ้งไว้เฉย ๆ ได้ ไม่กระทบอะไร หรือจะลบทีหลังก็ได้)
`NEXT_PUBLIC_API_URL` ที่ตั้งไว้ก็ไม่ต้องใช้แล้ว (ปล่อยไว้ได้)

---

## 📋 ขั้นตอน Deploy

### STEP A — เอาโค้ดใหม่ขึ้น GitHub (GitHub Desktop)

1. ดาวน์โหลด zip ใหม่ → แตกไฟล์ (แนะนำ `C:\pm` กัน path ยาว)
2. GitHub Desktop → repo `ponnv2`
3. ในโฟลเดอร์ repo (`C:\ponnv2`) → ลบทุกอย่างข้างในทิ้ง (ยกเว้น `.git`)
4. คัดลอกทุกอย่างจากโฟลเดอร์ที่แตก zip → วางลง repo folder
5. GitHub Desktop → เช็คว่าเห็นไฟล์ใหม่: `globals.css`, `board-data.ts`, และ `auth.ts` ที่แก้แล้ว
6. Commit → Push

### STEP B — เช็คว่า Secrets ครบก่อน (สำคัญที่สุดสำหรับ Login)

หลัง build เสร็จ เปิด: `https://pm.ponnsth.com/api/debug`

**ต้องได้ทุกค่าเป็น true:**
```json
{
  "env": {
    "DB_BOUND": true,
    "AUTH_SECRET_SET": true,          ← ★ ถ้าเป็น false = สาเหตุ login fail
    "GOOGLE_CLIENT_ID_SET": true,
    "GOOGLE_CLIENT_SECRET_SET": true
  },
  "db": { "ok": true, "userCount": 1 }
}
```

**ถ้า `AUTH_SECRET_SET: false`** → นี่คือสาเหตุ login fail! ไปตั้งที่:
Cloudflare Dashboard → Worker `pm-platform-web` → **Settings → Variables and Secrets** →
Add → ตั้งชื่อ `AUTH_SECRET` ค่าอะไรก็ได้ที่สุ่มยาว ๆ (เช่นจาก [generate-random.org/api-key-generator](https://generate-random.org/api-key-generator))
→ Save → รอ deploy ใหม่

**ถ้า `db.ok: false`** → ยังไม่ได้สร้างตาราง ไปทำ STEP C

### STEP C — สร้างตาราง + seed ข้อมูล (ถ้ายังไม่ทำ / userCount ไม่ใช่ 1)

D1 Console → เปิด `database/migrations/schema.sql` → Ctrl+A copy → วางใน Console →
**Ctrl+A ในกล่อง Query อีกครั้ง** → Run → ต้องเห็น "Executed 40/40"

เช็ค: `SELECT email FROM users;` ต้องเห็น `admin@ponnsth.com`

### STEP D — ทดสอบ Login

| วิธี | ข้อมูล | ผล |
|---|---|---|
| อีเมล + รหัสผ่าน | `admin@ponnsth.com` / `Ponnsth@2026` | เข้าได้ → board 3 คอลัมน์ |
| Google | เลือกบัญชี | เข้าได้ (ถ้า error เช็ค redirect URI) |

**Google redirect URI** ต้องตรงโดเมนจริง — [Google Console](https://console.cloud.google.com/apis/credentials)
→ OAuth Client → Authorized redirect URIs เพิ่ม:
```
https://pm.ponnsth.com/api/auth/callback/google
```

---

## Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|---|---|
| ยัง `error=Configuration` | เช็ค `/api/debug` → ถ้า `AUTH_SECRET_SET: false` ให้ตั้ง secret (STEP B) |
| Local login "ไม่ถูกต้อง" | ยังไม่ seed user — รัน STEP C แล้วเช็ค `SELECT email FROM users;` |
| Google `redirect_uri_mismatch` | เพิ่ม redirect URI ให้ตรง `https://pm.ponnsth.com/api/auth/callback/google` |
| board ขึ้น "ไม่พบ Project" | รัน STEP C (seed project/board ในไฟล์ schema.sql แล้ว) |
| Font ไม่เป็น Sarabun | hard refresh (Ctrl+Shift+R) — CSS cache เก่า |

---

## 🗑️ หลังใช้งานได้ (ทำเมื่อพร้อม)

ลบ `apps/web/src/app/api/debug/route.ts` ทิ้ง (diagnostic tool ไม่ควรเหลือใน production)
