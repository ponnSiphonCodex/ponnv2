/**
 * apps/web/src/app/api/logout/route.ts
 * ลบ session cookie แล้ว redirect ไป /login
 */
import type { NextRequest } from "next/server";
import { buildClearSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const res = new Response(null, { status: 302, headers: { Location: `${url.origin}/login` } });
  res.headers.append("Set-Cookie", buildClearSessionCookie());
  return res;
}
