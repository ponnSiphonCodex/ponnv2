/**
 * apps/web/src/app/api/auth/set-password/route.ts
 *
 * ตั้ง/เปลี่ยนรหัสผ่านสำหรับ Login แบบอีเมล+รหัสผ่าน
 * ป้องกันด้วยการเช็ค setupSecret ตรงกับ AUTH_SECRET (ค่าที่ตั้งไว้ใน Cloudflare
 * Dashboard เท่านั้น — มีแค่เจ้าของระบบที่รู้ค่านี้) ไม่เปิดให้ตั้งรหัสผ่านได้อิสระ
 * โดยไม่รู้ความลับนี้
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, users } from "@/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let email: string | undefined;
    let password: string | undefined;
    let setupSecret: string | undefined;
    let name: string | undefined;

    try {
      const body = (await req.json()) as {
        email?: string;
        password?: string;
        setupSecret?: string;
        name?: string;
      };
      email = body.email?.trim().toLowerCase();
      password = body.password;
      setupSecret = body.setupSecret;
      name = body.name;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid request body" }, { status: 400 });
    }

    if (!email || !password || !setupSecret) {
      return NextResponse.json({ ok: false, error: "กรอกข้อมูลไม่ครบ" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const { env } = getCloudflareContext();

    if (setupSecret !== env.AUTH_SECRET) {
      return NextResponse.json({ ok: false, error: "รหัสลับไม่ถูกต้อง" }, { status: 401 });
    }

    const db = createDb(env.DB);
    const passwordHash = await hashPassword(password);

    const [existing] = await db.select().from(users).where(eq(users.email, email));

    if (existing) {
      await db.update(users).set({ passwordHash }).where(eq(users.email, email));
    } else {
      await db.insert(users).values({ email, name: name ?? email, passwordHash });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "internal error: " + message }, { status: 500 });
  }
}
