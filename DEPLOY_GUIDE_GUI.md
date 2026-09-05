# คู่มือ Deploy (v13) — Auth เขียนเอง (เลิก NextAuth) + File Upload Google Drive

## 🎯 รอบนี้แก้อะไร

1. **ทิ้ง NextAuth ทั้งหมด** → เขียน auth เอง (session cookie + HMAC + Google OAuth manual)
   จบปัญหา `error=Configuration` / "Server error" ถาวร
2. **เพิ่ม File Upload → Google Drive** ผ่าน Apps Script (ตามที่ขอ)
3. Login ทั้ง Google + Email/Password ใช้งานได้จริง (ทดสอบ session แล้ว)

---

## STEP A — เอาโค้ดขึ้น GitHub (GitHub Desktop)

1. ดาวน์โหลด zip → แตกที่ `C:\pm` (path สั้น)
2. GitHub Desktop → repo `ponnv2`
3. ในโฟลเดอร์ repo (`C:\ponnv2`) → **ลบทุกอย่างข้างในทิ้ง** (ยกเว้น `.git`)
   ⚠️ สำคัญมาก: เพื่อล้างไฟล์ NextAuth เก่า (`lib/auth.ts`, `api/auth/[...nextauth]/`) ที่เป็นตัวปัญหา
4. คัดลอกทุกอย่างจาก `C:\pm` → วางลง repo folder
5. Commit → Push

**เช็คใน GitHub ว่าไฟล์เก่าหายจริง:** `apps/web/src/app/api/auth/` ต้องมีแค่โฟลเดอร์ `google/`
(ไม่มี `[...nextauth]` แล้ว) และ `apps/web/src/lib/` ต้องไม่มี `auth.ts`

---

## STEP B — เพิ่ม Google Redirect URI ใหม่ (สำคัญสำหรับปุ่ม Google)

เพราะเขียน OAuth flow เอง callback path เปลี่ยน ต้องเพิ่มใน
[Google Console](https://console.cloud.google.com/apis/credentials) → คลิก OAuth Client →
**Authorized redirect URIs** → Add:
```
https://pm.ponnsth.com/api/auth/google/callback
```
(ของเดิม `/api/auth/callback/google` จะไม่ใช้แล้ว ลบทิ้งหรือเก็บไว้ก็ได้) → Save

---

## STEP C — เช็ค Secrets + สร้างตาราง

หลัง build เสร็จ เปิด `https://pm.ponnsth.com/api/debug`

ต้องได้:
```json
{ "env": { "DB_BOUND": true, "AUTH_SECRET_SET": true, "GOOGLE_CLIENT_ID_SET": true, "GOOGLE_CLIENT_SECRET_SET": true },
  "db": { "ok": true, "userCount": 1 } }
```

- ถ้า `AUTH_SECRET_SET: false` → ตั้ง secret: Worker `pm-platform-web` → Settings →
  Variables and Secrets → Add `AUTH_SECRET` (ค่าสุ่มยาว ๆ) → Save
- ถ้า `db.ok: false` หรือ `userCount` ไม่ใช่ 1 → รัน SQL:
  D1 Console → เปิด `database/migrations/schema.sql` → Ctrl+A copy → วาง → **Ctrl+A ในกล่อง Query** → Run

---

## STEP D — ทดสอบ Login

| วิธี | ข้อมูล | ผล |
|---|---|---|
| อีเมล + รหัสผ่าน | `admin@ponnsth.com` / `Ponnsth@2026` | เข้าได้ → board |
| บัญชี Google | เลือกบัญชี | เข้าได้ (ถ้าทำ STEP B แล้ว) |

---

## STEP E — ตั้งค่า File Upload → Google Drive (ทำเมื่อพร้อมใช้)

### E.1 — ตั้งค่า Apps Script
1. เปิดโปรเจกต์ Google Script ของคุณ (จาก URL ที่มี)
2. วางโค้ดจาก `google-apps-script/Code.gs` (ในโปรเจกต์นี้) ทับใน Code.gs
3. แก้ `FOLDER_ID` เป็นโฟลเดอร์ Drive ที่ต้องการ (หรือเว้นว่างเก็บใน My Drive)
4. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone** ← สำคัญมาก ไม่งั้น fetch จากเว็บโดนบล็อก
5. คัดลอก Web app URL (`.../exec`)

### E.2 — ใส่ URL ในเว็บ
แก้ `apps/web/src/lib/upload.ts` บรรทัด `DEFAULT_DRIVE_UPLOAD_URL` เป็น URL ของคุณ
(URL ที่คุณให้มาใส่ไว้เป็นค่าเริ่มต้นแล้ว) → commit + push

### E.3 — ใช้คอมโพเนนต์
```tsx
import { FileUpload } from "@/components/file-upload";
<FileUpload onUploaded={(r) => console.log(r.fileId, r.url)} />
```

---

## Troubleshooting

| อาการ | วิธีแก้ |
|---|---|
| ยัง Server error / Configuration | ยังมีไฟล์ NextAuth เก่าค้าง — STEP A ข้อ 3 ลบให้หมด เช็คว่าไม่มี `lib/auth.ts` และ `[...nextauth]` |
| Google ขึ้น redirect_uri_mismatch | ยังไม่ทำ STEP B — เพิ่ม `/api/auth/google/callback` |
| Local login ไม่ได้ | `userCount` ต้อง = 1 (STEP C) เช็ค `SELECT email FROM users;` |
| Upload ไม่สำเร็จ (CORS/403) | Apps Script "Who has access" ต้องเป็น **Anyone** (STEP E.1 ข้อ 4) |
