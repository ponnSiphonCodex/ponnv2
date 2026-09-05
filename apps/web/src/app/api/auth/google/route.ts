/**
 * apps/web/src/app/api/auth/google/route.ts
 *
 * รับ ID token (Google Identity Services credential) จากฝั่ง client โดยตรง
 * แล้วตรวจสอบกับ Google เอง (วิธีเดียวกับที่ทำสำเร็จในโปรเจกต์ Rentals — ดู
 * ponn-domain-main/gas/Code.gs ฟังก์ชัน verifyGoogle) แทนที่จะพึ่ง NextAuth's
 * Google Provider ที่ต้องผ่าน OAuth redirect flow เต็มรูปแบบ (Authorization Code +
 * callback URL) ซึ่งมีจุดพังเยอะกว่าบน Edge Runtime
 *
 * ข้อดี: ต้องใช้แค่ "Authorized JavaScript origins" ใน Google Console (ไม่ต้องพึ่ง
 * Authorized redirect URIs ที่ตั้งค่าผิดพลาดได้ง่ายกว่ามาก)
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { signSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Client ID ไม่ใช่ความลับ (ต่างจาก Client Secret) — ฝังตรงนี้ได้ปลอดภัย
const GOOGLE_CLIENT_ID = "71834421978-cuhvt0kbulcki1e8q4e1d7pmt1kq8sk6.apps.googleusercontent.com";

type GoogleTokenInfo = {
  aud: string;
  email: string;
  email_verified: string;
  exp: string;
  name?: string;
  picture?: string;
};

export async function POST(req: NextRequest) {
  let credential: string | undefined;
  try {
    const body = (await req.json()) as { credential?: string };
    credential = body.credential;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
  }

  if (!credential) {
    return NextResponse.json({ ok: false, error: "missing credential" }, { status: 400 });
  }

  // ตรวจ ID token กับ Google โดยตรง — ไม่ต้องใช้ library เพิ่ม
  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
  if (verifyRes.status !== 200) {
    return NextResponse.json({ ok: false, error: "invalid google token" }, { status: 401 });
  }

  const info = (await verifyRes.json()) as GoogleTokenInfo;

  if (info.aud !== GOOGLE_CLIENT_ID) {
    return NextResponse.json({ ok: false, error: "client id mismatch" }, { status: 401 });
  }
  if (info.email_verified !== "true") {
    return NextResponse.json({ ok: false, error: "email not verified" }, { status: 401 });
  }
  if (Number(info.exp) * 1000 < Date.now()) {
    return NextResponse.json({ ok: false, error: "token expired" }, { status: 401 });
  }

  const email = info.email.toLowerCase();
  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  // หา user เดิม หรือสร้างใหม่ (สมัครครั้งแรกด้วย Google = สมัครสมาชิกอัตโนมัติ)
  let [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    [user] = await db
      .insert(users)
      .values({ email, name: info.name ?? email, image: info.picture ?? null })
      .returning();
  }

  const token = await signSessionToken({ sub: user.id, email: user.email, name: user.name }, env.AUTH_SECRET);

  const isHttps = req.nextUrl.protocol === "https:";
  const cookieName = isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
