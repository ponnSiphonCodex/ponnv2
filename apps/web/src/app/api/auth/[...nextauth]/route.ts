/**
 * apps/web/src/app/api/auth/[...nextauth]/route.ts
 * ต้องสร้าง NextAuth instance ใหม่ทุก request เพราะ D1 binding (env.DB) มีให้ใช้
 * ก็ต่อเมื่ออยู่ใน request scope ของ Cloudflare Workers runtime เท่านั้น
 *
 * ⚠️ getCloudflareContext() ไม่รับ generic type parameter สำหรับ env — env type มาจาก
 * global interface `CloudflareEnv` ที่ประกาศไว้ใน apps/web/cloudflare-env.d.ts เสมอ
 * (เขียนไว้แทนคำสั่ง `wrangler types` ที่ปกติต้องรันผ่าน CLI)
 */
import NextAuth from "next-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getAuthConfig } from "@/lib/auth";

function buildHandler() {
  const { env } = getCloudflareContext();

  const db = createDb(env.DB);
  const config = getAuthConfig(db, {
    AUTH_SECRET: env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  });

  return NextAuth(config).handlers;
}

export async function GET(req: Request) {
  const { GET: handler } = buildHandler();
  return handler(req);
}

export async function POST(req: Request) {
  const { POST: handler } = buildHandler();
  return handler(req);
}
