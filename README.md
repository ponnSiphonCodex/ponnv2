# Portfolio Workspace — PM & Portfolio (Cloudflare D1 + Workers)

## v14 — Auth เขียนเอง JS ธรรมดา (ไม่ใช้ NextAuth) + แก้ Favicon

- Session = signed cookie HMAC (`lib/session.ts`), Local login (`api/login`), Google OAuth เขียนเอง
- **Favicon fix**: ย้ายไอคอนไป public/ + middleware exclude + metadata icons explicit
- Font 15px, ตัด subtitle "ระบบบริหารพอร์ตโครงการองค์กร" ออก

## Login
- Google **หรือ** Email+Password
- Local user: admin@ponnsth.com / Ponnsth@2026

## ⚠️ ต้องตั้ง Secrets ใน Cloudflare (Worker > Settings > Variables and Secrets)
ต้องเป็น **Secret (encrypted)** ไม่ใช่ Variable: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
เช็คที่ /api/debug ต้องได้ true ครบ

## Google redirect URI
`https://pm.ponnsth.com/api/auth/callback/google` (ตรงกับ Console แล้ว)

## File Upload → Google Drive
lib/upload.ts + components/file-upload.tsx + google-apps-script/Code.gs
