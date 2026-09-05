/**
 * apps/web/src/app/api/auth/[...nextauth]/route.ts
 * ต้องสร้าง NextAuth instance ใหม่ทุก request เพราะ D1 binding (env.DB) มีให้ใช้
 * ก็ต่อเมื่ออยู่ใน request scope ของ Cloudflare Workers runtime เท่านั้น
 *
 * ⚠️ param ต้อง type เป็น NextRequest (ไม่ใช่ Request) เพราะ handler ที่ NextAuth คืนมา
 * ต้องการ NextRequest — ถ้าใช้ Request ธรรมดาจะ type error ตอน build
 * ("Request is not assignable to parameter of type 'NextRequest'")
 */
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getAuthConfig } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
