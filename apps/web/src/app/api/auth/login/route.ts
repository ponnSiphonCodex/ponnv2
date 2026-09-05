/**
 * apps/web/src/app/api/auth/login/route.ts
 * Login ด้วยอีเมล + รหัสผ่าน (ต้องตั้งรหัสผ่านไว้ก่อนผ่าน /setup หรือ seed SQL)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { signSessionToken, SESSION_MAX_AGE_SECONDS, getCookieDomain, getSessionCookieName } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;
    let password: string | undefined;
    try {
      const body = (await req.json()) as { email?: string; password?: string };
      email = body.email?.trim().toLowerCase();
      password = body.password;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "กรุณากรอกอีเมลและรหัสผ่าน" }, { status: 400 });
    }

    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user || !user.passwordHash) {
      return NextResponse.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const token = await signSessionToken({ sub: user.id, email: user.email, name: user.name }, env.AUTH_SECRET);

    const isHttps = req.nextUrl.protocol === "https:";
    const res = NextResponse.json({ ok: true });
    res.cookies.set(getSessionCookieName(isHttps), token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      domain: getCookieDomain(req.nextUrl.hostname),
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[auth/login] internal error:", message);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
