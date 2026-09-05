/**
 * apps/web/cloudflare-env.d.ts
 * ประกาศ global CloudflareEnv interface ตาม bindings ใน wrangler.jsonc
 * getCloudflareContext() ใช้ type นี้อัตโนมัติ (ไม่ต้องใส่ generic <> ตอนเรียก)
 */
interface CloudflareEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ASSETS: Fetcher;
}
