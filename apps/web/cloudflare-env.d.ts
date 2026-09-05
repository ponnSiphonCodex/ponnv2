/**
 * apps/web/cloudflare-env.d.ts
 *
 * ปกติไฟล์นี้ต้อง generate อัตโนมัติด้วยคำสั่ง:
 *   wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts
 * (ตาม binding ที่ประกาศไว้ใน wrangler.jsonc) แต่เพราะ deploy ผ่านหน้าเว็บ Cloudflare
 * ล้วน ไม่มี local CLI ให้รันคำสั่งนี้ จึงต้องเขียน interface นี้ด้วยมือแทน
 *
 * ⚠️ getCloudflareContext() จาก @opennextjs/cloudflare type ค่า `env` ที่คืนกลับมาจาก
 * global interface ชื่อ `CloudflareEnv` นี้เสมอ — "ไม่ใช่" จาก generic type parameter ที่ใส่ตอนเรียก
 * (เช่น getCloudflareContext<{ DB: ... }>() ตัว <{ DB: ... }> ไปกำหนด type ของ `cf` ไม่ใช่ `env`)
 * เข้าใจผิดจุดนี้มาก่อน เลยเจอ error "Property 'DB' does not exist on type 'CloudflareEnv'"
 * ตอน build เพราะ CloudflareEnv ไม่เคยถูกประกาศไว้เลย (ว่างเปล่า) ก่อนมีไฟล์นี้
 *
 * ⚠️ ถ้าเพิ่ม binding ใหม่ใน wrangler.jsonc (เช่น KV, R2, D1 ตัวใหม่) ต้องมาเพิ่ม property
 * ในนี้ด้วยมือให้ตรงกันเสมอ ไม่งั้น TypeScript จะมองไม่เห็น
 */
interface CloudflareEnv {
  // D1 binding — ต้องตรงกับ "binding": "DB" ใน apps/web/wrangler.jsonc
  DB: D1Database;

  // Assets binding ที่ OpenNext ใช้เอง (ประกาศไว้กันเผื่อ TypeScript อ้างถึง)
  ASSETS: Fetcher;

  // Secrets — ตั้งผ่าน Cloudflare Dashboard > Worker > Settings > Variables and Secrets
  // (ไม่ได้ประกาศใน wrangler.jsonc เพราะเป็นความลับ แต่ TypeScript ต้องรู้จัก property เหล่านี้)
  AUTH_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}
