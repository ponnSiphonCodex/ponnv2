/**
 * apps/web/cloudflare-env.d.ts
 * global CloudflareEnv ตาม bindings ใน wrangler.jsonc — getCloudflareContext() ใช้ type นี้อัตโนมัติ
 */
interface CloudflareEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ASSETS: Fetcher;
}
