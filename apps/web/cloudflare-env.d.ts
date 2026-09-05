/**
 * apps/web/cloudflare-env.d.ts
 *
 * ประกาศ global CloudflareEnv interface ตาม bindings ที่ตั้งไว้ใน wrangler.jsonc
 * getCloudflareContext() ของ @opennextjs/cloudflare จะใช้ type นี้โดยอัตโนมัติ
 * (ไม่ต้องใส่ generic <{...}> ตรงจุดเรียกใช้ — วิธีนั้นใช้ไม่ได้ผล เพราะ generic ของ
 * getCloudflareContext สงวนไว้สำหรับ `cf` properties ไม่ใช่ `env`)
 *
 * ปกติไฟล์นี้ auto-generate ได้ด้วย `wrangler types --env-interface CloudflareEnv`
 * แต่เขียนเองตรงนี้แทนเพราะ deploy ผ่าน Cloudflare Dashboard ไม่ได้รัน CLI นี้ให้
 */
interface CloudflareEnv {
  DB: D1Database;
  AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ASSETS: Fetcher;
}
