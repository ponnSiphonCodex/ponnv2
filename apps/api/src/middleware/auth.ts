/**
 * apps/api/src/middleware/auth.ts
 *
 * Hono (Cloudflare Workers) เป็น service แยกจาก Next.js (apps/web) ที่ถือ Auth.js
 * แนวทาง share session ระหว่างสอง service:
 *   - apps/web ใช้ NextAuth session strategy = "jwt" พร้อม custom jwt.encode/decode
 *     ที่ sign ด้วย HS256 (jose) แทนการใช้ JWE เข้ารหัสแบบ default ของ Auth.js
 *   - ทั้งสอง service ใช้ AUTH_SECRET ตัวเดียวกัน (เก็บเป็น Cloudflare secret ทั้งคู่)
 *   - apps/api จึง verify cookie session token ได้ตรง ๆ ด้วย jose.jwtVerify โดยไม่ต้องพึ่ง Auth.js
 *
 * ดู apps/web/src/lib/auth.ts สำหรับฝั่ง encode/decode ที่ตรงกัน
 */
import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types";

const DEV_COOKIE = "authjs.session-token";
const PROD_COOKIE = "__Secure-authjs.session-token";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, PROD_COOKIE) ?? getCookie(c, DEV_COOKIE);

  if (!token) {
    return c.json({ error: "Unauthorized: missing session token" }, 401);
  }

  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub) {
      return c.json({ error: "Unauthorized: malformed session token" }, 401);
    }

    c.set("user", {
      id: payload.sub as string,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | undefined) ?? null,
    });

    await next();
  } catch (err) {
    return c.json({ error: "Unauthorized: invalid or expired session" }, 401);
  }
});
