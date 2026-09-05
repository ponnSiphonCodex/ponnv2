import NextAuth from "next-auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
import { getAuthConfig } from "@/lib/auth";

function buildHandler() {
  const { env } = getCloudflareContext<{
    DB: D1Database; AUTH_SECRET: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string;
  }>();

  const db = createDb(env.DB);
  const config = getAuthConfig(db, {
    AUTH_SECRET: env.AUTH_SECRET, GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
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
