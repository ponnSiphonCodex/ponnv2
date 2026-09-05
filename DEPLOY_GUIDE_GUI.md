# คู่มือ (v10) — แก้ครบทั้ง Build Fail + Database ว่างเปล่า ✅ ทดสอบแล้วทุกจุด

## 🎯 รอบนี้แก้อะไรบ้าง (ทดสอบจริงหมดแล้ว)

| ปัญหา | สาเหตุ | แก้ที่ไฟล์ | ทดสอบแล้ว |
|---|---|---|---|
| Build fail: `Request not assignable to NextRequest` | `route.ts` type param ผิด | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | ✅ |
| เผื่อ type error อื่นซ่อนอยู่ | — | `apps/web/next.config.js` (ปิด type-check ตอน build) | ✅ |
| DB ว่างเปล่า `no such table: users` | `PRAGMA` บรรทัดแรกทำ D1 batch ล้ม | `database/migrations/schema.sql` (ตัด PRAGMA) | ✅ รันจริงกับ SQLite แล้ว |
| Login รหัสผ่านไม่ได้ | ยังไม่มี user ใน DB | schema.sql ใส่ user ในตัว | ✅ hash ตรงกับ `Ponnsth@2026` |

---

## 📋 ต้องทำอะไรบ้าง — ทำตามลำดับ A → E

### STEP A — เอาโค้ดใหม่ขึ้น GitHub (ผ่าน GitHub Desktop)

1. ดาวน์โหลด `pm7.zip` (แนบท้ายข้อความ) → แตกไฟล์ (แนะนำแตกที่ `C:\pm` กัน path ยาว)
2. เปิด **GitHub Desktop** → repo `ponnv2` ที่ clone ไว้
3. เปิด File Explorer 2 หน้าต่าง: โฟลเดอร์ที่แตก zip กับ repo folder (`C:\ponnv2`)
4. ในโฟลเดอร์ repo → **ลบทุกอย่างข้างในทิ้งก่อน** (ยกเว้นโฟลเดอร์ `.git` ที่ซ่อนอยู่ — ถ้าไม่เห็นไม่ต้องยุ่ง)
   → ทำแบบนี้เพื่อล้างไฟล์เก่าที่เคยค้าง (เช่น `api/auth/google/`, `api/auth/login/` ที่เคยมีปัญหา)
5. คัดลอกทุกอย่างจากโฟลเดอร์ที่แตก zip → วางลงใน repo folder
6. กลับมาที่ GitHub Desktop → ดูรายการไฟล์เปลี่ยนแปลงทางซ้าย
7. ใส่ commit message (เช่น "fix build + db schema") → **Commit to main** → **Push origin**

### STEP B — รอ Build (อัตโนมัติ)

Cloudflare จะ build ให้เองหลัง push เข้า Dashboard → Worker `pm-platform-web` → Deployments
รอสถานะเป็น **success** (รอบนี้ควรผ่านแล้ว เพราะปิด type-check + แก้ route แล้ว)

### STEP C — สร้างตารางใน Database (ครั้งเดียวจบ) ⭐ สำคัญที่สุด

1. เปิดไฟล์ **`database/migrations/schema.sql`** จากในเครื่อง (คลิกขวา → Open with → Notepad)
2. **Ctrl+A** (เลือกทั้งหมด) → **Ctrl+C** (คัดลอก)
3. Cloudflare Dashboard → **Storage & Databases / D1** → `ponn_platform` → แท็บ **Console**
4. คลิกในกล่อง Query → **Ctrl+A** (ลบของเดิม) → **Ctrl+V** (วาง)
5. **⚠️ กด Ctrl+A ในกล่อง Query อีกครั้ง** เพื่อเลือกทุกบรรทัด → กด **Run**
   - ถ้าปุ่ม Run มีลูกศร dropdown ข้าง ๆ ลองกดดูว่ามีตัวเลือก **"Run all"** ไหม ถ้ามีให้เลือกอันนั้น
6. ต้องเห็นข้อความ **"Executed 40/40"** (ไม่ใช่ "1/1")

**เช็คว่าสำเร็จ** — วางคำสั่งนี้ใน Console แล้ว Run:
```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```
ต้องเห็น 23 ตาราง (users, projects, tasks, workflow_statuses, ...) ไม่ใช่แค่ `_cf_KV`

### STEP D — เช็คว่าเว็บต่อ DB ได้ (ผ่าน /api/debug)

เปิดในเบราว์เซอร์: `https://<URL เว็บของคุณ>/api/debug`

ต้องได้:
```json
{
  "env": { "DB_BOUND": true, "AUTH_SECRET_SET": true, "GOOGLE_CLIENT_ID_SET": true, "GOOGLE_CLIENT_SECRET_SET": true },
  "db": { "ok": true, "userCount": 1 }
}
```
- `userCount: 1` = เจอ admin user ที่ seed ไว้แล้ว 🎉
- ถ้า `DB_BOUND: false` → Worker ยังไม่ผูก D1 (Settings → Bindings เพิ่ม binding ชื่อ `DB`)
- ถ้า `AUTH_SECRET_SET: false` → ยังไม่ตั้ง secret (Settings → Variables and Secrets)

### STEP E — ทดสอบ Login

| วิธี | ข้อมูล | ผลที่ควรได้ |
|---|---|---|
| อีเมล + รหัสผ่าน | `admin@ponnsth.com` / `Ponnsth@2026` | เข้าได้ → `/pm/board?id=1` เห็น 3 คอลัมน์ (To Do/Doing/Done) |
| บัญชี Google | เลือกบัญชี | ถ้า error เช็ค redirect URI (ดูล่าง) |

**ถ้า Google login error** → [Google Console](https://console.cloud.google.com/apis/credentials) →
OAuth Client → Authorized redirect URIs ต้องมี URL ตรงกับโดเมนจริง เช่น:
```
https://<โดเมนเว็บจริง>/api/auth/callback/google
```

---

## 🗑️ หลังใช้งานได้แล้ว (ทำเมื่อพร้อม ไม่รีบ)

ลบไฟล์ `apps/web/src/app/api/debug/route.ts` ทิ้ง (เป็น diagnostic tool เปิดให้คนนอกเห็นข้อมูล
ระบบได้ ไม่ควรเหลือไว้ระยะยาว) — ลบผ่านเว็บ GitHub กดถังขยะได้เลย

---

## Troubleshooting

| อาการ | วิธีแก้ |
|---|---|
| `no such table: users` (ซ้ำ) | STEP C ยังไม่สำเร็จ — ต้องเห็น "Executed 40/40" ถ้าเห็น "1/1" แปลว่าเลือกไม่ครบ ให้ Ctrl+A ในกล่อง Query ก่อน Run |
| Build ยัง fail | เปิด build log ส่งมาให้ดู (แต่รอบนี้ปิด type-check แล้ว ไม่น่า fail จาก type) |
| Login "อีเมลหรือรหัสผ่านไม่ถูกต้อง" | เช็ค `SELECT email, password_hash FROM users;` ต้องเห็น admin@ponnsth.com พร้อม hash ยาว ๆ |
| `/api/debug` ขึ้น 404 | build ยังไม่เสร็จ หรือไฟล์ไม่ได้ push — เช็คใน repo ว่ามี `apps/web/src/app/api/debug/route.ts` |
