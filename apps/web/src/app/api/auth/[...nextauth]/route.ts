/**
 * apps/web/src/app/api/auth/[...nextauth]/route.ts
 * ต้องสร้าง NextAuth instance ใหม่ทุก request เพราะ D1 binding (env.DB) มีให้ใช้
 * ก็ต่อเมื่ออยู่ใน request scope ของ Cloudflare Workers runtime เท่านั้น
 */
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getAuthConfig } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function buildHandler() {
  const { env } = await getCloudflareContext({ async: true });

  const db = createDb(env.DB);
  const config = getAuthConfig(db, {
    AUTH_SECRET: env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
  });

  return NextAuth(config).handlers;
}

export async function GET(req: NextRequest) {
  const { GET: handler } = await buildHandler();
  return handler(req);
}

export async function POST(req: NextRequest) {
  const { POST: handler } = await buildHandler();
  return handler(req);
}
