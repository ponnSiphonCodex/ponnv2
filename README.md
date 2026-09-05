# Portfolio Workspace — PM & Portfolio (Cloudflare D1 + Workers)

## v16 — แก้ Login (secrets โดนลบ) + Favicon

### ★ Login fix — ฝัง secrets ใน wrangler.jsonc
ปัญหา: ตั้ง secrets เป็น "Variable" ใน Dashboard → opennextjs-cloudflare deploy (wrangler deploy)
ลบทิ้งทุกครั้ง → /api/debug ขึ้น false → login พังทั้ง Google + Local
แก้: ย้าย AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ไปไว้ใน `apps/web/wrangler.jsonc` (vars)
→ deploy พร้อมโค้ดทุกครั้ง ไม่มีทางหาย (repo ต้อง Private)

### ★ Favicon fix — icons อยู่ใน public/ อย่างเดียว
เดิม v15 มี icons ซ้ำทั้ง app/ และ public/ → ชนกัน → favicon ไม่ขึ้น
แก้: icons อยู่ public/ อย่างเดียว + middleware matcher exclude ไฟล์ .png/.ico + metadata.icons ชี้ /favicon.ico

## Login
- Google **หรือ** admin@ponnsth.com / Ponnsth@2026

## Google redirect URI (ต้องมีใน Console)
https://pm.ponnsth.com/api/auth/callback/google

## File Upload → Google Drive: lib/upload.ts + components/file-upload.tsx + google-apps-script/Code.gs
