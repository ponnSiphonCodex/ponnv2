/**
 * apps/web/src/app/api/auth/[...nextauth]/route.ts
 *
 * ⚠️ ตำแหน่งไฟล์สำคัญมาก: ต้องอยู่ที่
 *   apps/web/src/app/api/auth/[...nextauth]/route.ts
 * เท่านั้น (ลึก 4 ชั้นจาก src/app) ไม่ใช่วางไว้ตรง ๆ ที่ src/app/route.ts
 *
 * ต้องสร้าง NextAuth instance ใหม่ทุก request เพราะ D1 binding (env.DB)
 * มีให้ใช้ก็ต่อเมื่ออยู่ใน request scope ของ Cloudflare Workers runtime เท่านั้น
 *
 * getCloudflareContext() ไม่ต้องใส่ generic — env type มาจาก global CloudflareEnv
 * interface ที่ประกาศไว้ใน apps/web/cloudflare-env.d.ts
 *
 * req ต้องเป็น NextRequest (ไม่ใช่ Request ธรรมดา) ตาม convention ของ Next.js 15
 * App Router Route Handler
 */
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
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

export async function GET(req: NextRequest) {
  const { GET: handler } = buildHandler();
  return handler(req);
}

export async function POST(req: NextRequest) {
  const { POST: handler } = buildHandler();
  return handler(req);
}
