# Portfolio Workspace — PM & Portfolio (Cloudflare D1 + Workers)

## ⭐ v13 — เขียน Auth เองด้วย JavaScript ธรรมดา (เลิกใช้ NextAuth)

NextAuth v5 beta ทำ `error=Configuration` บน Cloudflare ซ้ำหลายรอบ — เวอร์ชันนี้**ทิ้ง NextAuth
ทั้งหมด** เขียนระบบ auth เองด้วย JS + Web Crypto:

- **Session** = signed cookie (HMAC-SHA256) — `src/lib/session.ts`
- **Local login** = POST `/api/login` → verify PBKDF2 → set cookie — `src/app/api/login/route.ts`
- **Google login** = OAuth 2.0 flow เขียนเอง (`/api/auth/google` → `/api/auth/google/callback`)
- **เช็ค session ในหน้า** = `getCurrentUser()` อ่าน cookie + verify — `src/lib/current-user.ts`
- ไม่มี dependency `next-auth` / `@auth/*` อีกต่อไป → ตัดต้นตอ Configuration error ถาวร

ทดสอบแล้ว: session sign/verify ถูกต้อง, ปฏิเสธ secret ผิด + token ปลอม

## Login
- Google OAuth **หรือ** Email+Password (2 แท็บ, Sarabun 14px, 100dvh ไม่ scroll)
- Local user ทดสอบ: `admin@ponnsth.com` / `Ponnsth@2026`

## ⚠️ Google OAuth — เพิ่ม redirect URI ใหม่
เพราะเขียน flow เอง callback path เปลี่ยนเป็น `/api/auth/google/callback` ต้องเพิ่มใน
[Google Console](https://console.cloud.google.com/apis/credentials) → Authorized redirect URIs:
```
https://pm.ponnsth.com/api/auth/google/callback
```

## File Upload → Google Drive (Apps Script)
- `src/lib/upload.ts` — แปลงไฟล์เป็น Base64 → POST ไป Apps Script /exec
- `src/components/file-upload.tsx` — คอมโพเนนต์ `<FileUpload />` พร้อมใช้
- `google-apps-script/Code.gs` — โค้ด Apps Script (paste ในโปรเจกต์ Google Script ของคุณ)
- ตั้ง URL ใน `src/lib/upload.ts` (DEFAULT_DRIVE_UPLOAD_URL) หรือ env `NEXT_PUBLIC_DRIVE_UPLOAD_URL`

## Routing
- `/login` — 2 แท็บ
- `/` — portal (redirect /pm ถ้าสิทธิ์เดียว)
- `/pm/board?id=1` — Kanban (query D1 ตรง)
- `/api/debug` — เช็ค D1 + secrets (ลบทิ้งหลัง debug)
- `/api/logout` — ออกจากระบบ

## หมายเหตุ
- ไม่มี API worker (Hono) แล้ว — web app ทำงานในตัวเองครบ query D1 ตรง
