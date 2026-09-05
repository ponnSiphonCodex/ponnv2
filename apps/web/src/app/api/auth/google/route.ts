/**
 * apps/web/src/app/api/auth/google/route.ts
 *
 * รับ OAuth2 access_token จาก client (Google Identity Services token client
 * แบบ prompt:'select_account' — เปิด popup ให้ผู้ใช้กดเลือกบัญชีเอง ไม่ใช่ปุ่มที่
 * โชว์ "ลงชื่อเข้าใช้เป็น [ชื่อ]" แบบ pre-filled ของ GIS ID-token button เดิม)
 *
 * เลือกใช้ access_token flow แทน ID token flow เพราะ:
 *   - ปุ่ม GIS แบบ ID token (renderButton) จะดึงบัญชี Google ที่ browser จำไว้
 *     มาโชว์ในปุ่มทันที (ประสบการณ์ที่ผู้ใช้ไม่ต้องการ)
 *   - access_token flow เปิด popup ของ Google ให้กดเลือกบัญชีทุกครั้งแทน
 *
 * ยังตรวจสอบ token กับ Google ฝั่ง server เสมอ (ไม่เชื่อ email/name ที่ client
 * ส่งมาตรง ๆ) — เรียก tokeninfo ก่อนเพื่อยืนยัน aud ตรงกับ Client ID ของเรา แล้ว
 * เรียก userinfo ด้วย access_token เดียวกันเพื่อได้ email/name/picture ที่แท้จริง
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { signSessionToken, SESSION_MAX_AGE_SECONDS, getCookieDomain, getSessionCookieName } from "@/lib/auth";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = "71834421978-cuhvt0kbulcki1e8q4e1d7pmt1kq8sk6.apps.googleusercontent.com";

type TokenInfo = { aud: string; scope: string; exp: string };
type UserInfo = { email: string; email_verified: boolean; name?: string; picture?: string };

export async function POST(req: NextRequest) {
  try {
    let accessToken: string | undefined;
    try {
      const body = (await req.json()) as { access_token?: string };
      accessToken = body.access_token;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "missing access token" }, { status: 400 });
    }

    const tokenInfoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (tokenInfoRes.status !== 200) {
      return NextResponse.json({ ok: false, error: "invalid google token" }, { status: 401 });
    }
    const tokenInfo = (await tokenInfoRes.json()) as TokenInfo;

    if (tokenInfo.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ ok: false, error: "client id mismatch" }, { status: 401 });
    }
    if (!tokenInfo.scope.includes("email")) {
      return NextResponse.json({ ok: false, error: "missing email scope" }, { status: 401 });
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfoRes.status !== 200) {
      return NextResponse.json({ ok: false, error: "failed to fetch user info" }, { status: 401 });
    }
    const info = (await userInfoRes.json()) as UserInfo;

    if (!info.email_verified) {
      return NextResponse.json({ ok: false, error: "email not verified" }, { status: 401 });
    }

    const email = info.email.toLowerCase();
    const { env } = getCloudflareContext();
    const db = createDb(env.DB);

    let [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      [user] = await db
        .insert(users)
        .values({ email, name: info.name ?? email, image: info.picture ?? null })
        .returning();
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
    // log รายละเอียดจริงไว้ฝั่ง server เท่านั้น — client เห็นแค่ error code สั้น ๆ
    console.error("[auth/google] internal error:", message);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
