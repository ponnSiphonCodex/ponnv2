/**
 * apps/web/src/app/api/auth/google/route.ts
 *
 * รับ ID token (Google Identity Services credential) จากฝั่ง client โดยตรง
 * แล้วตรวจสอบกับ Google เอง แทนที่จะพึ่ง NextAuth's Google Provider (OAuth redirect
 * flow เต็มรูปแบบ ซึ่งมีจุดพังเยอะกว่าบน Edge Runtime)
 *
 * ⚠️ สำคัญ: ทุก error ต้อง catch แล้วคืนเป็น JSON เสมอ (ห้ามปล่อยให้ throw หลุดออกไป)
 * เพราะถ้าปล่อยหลุด Cloudflare จะคืน HTML error page แทน JSON ฝั่ง client ที่พยายาม
 * res.json() จะ parse ไม่ผ่านแล้วเห็นแค่ error กว้าง ๆ ว่า "เชื่อมต่อไม่สำเร็จ"
 * (ไม่รู้สาเหตุจริง) — ห่อ try/catch ทั้งฟังก์ชันแก้ปัญหานี้ตรงจุด
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { signSessionToken, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
  try {
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

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (verifyRes.status !== 200) {
      return NextResponse.json({ ok: false, error: "google token verify failed (status " + verifyRes.status + ")" }, { status: 401 });
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
  } catch (err) {
    // ดักทุกอย่างที่ไม่คาดคิด (เช่น env.DB ไม่มี, DB query error) ให้คืน JSON เสมอ
    // ไม่ปล่อยให้เป็น HTML error page ที่ทำให้ client แสดง error กว้าง ๆ
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "internal error: " + message }, { status: 500 });
  }
}
