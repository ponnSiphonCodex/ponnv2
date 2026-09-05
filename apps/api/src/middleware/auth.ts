/**
 * apps/api/src/middleware/auth.ts
 * apps/web ออก session เป็น JWT (HS256, sign เอง ไม่ใช่ JWE default ของ Auth.js)
 * apps/api verify ด้วย secret เดียวกัน (AUTH_SECRET) ผ่าน jose
 *
 * ⚠️ เช็ค claim "ver" ตรงกับ APP_VERSION ที่ deploy อยู่ตอนนี้ด้วย — เพราะ session
 * cookie ตั้งอายุยาวเป็นสิบปี (ผู้ใช้ต้องการให้ login ค้างตลอดไป) การ invalidate
 * session เก่าตอน deploy เวอร์ชันใหม่เลยทำผ่านการเทียบเลขเวอร์ชันแทนเวลาหมดอายุ
 */
import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import { APP_VERSION } from "../version";

const DEV_COOKIE = "authjs.session-token";
const PROD_COOKIE = "__Secure-authjs.session-token";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, PROD_COOKIE) ?? getCookie(c, DEV_COOKIE);

  if (!token) {
    return c.json({ error: "Unauthorized: missing session token" }, 401);
  }

  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    if (!payload.sub) {
      return c.json({ error: "Unauthorized: malformed session token" }, 401);
    }
    if (payload.ver !== APP_VERSION) {
      return c.json({ error: "Unauthorized: session outdated, please login again" }, 401);
    }

    c.set("user", {
      id: payload.sub as string,
      email: (payload.email as string) ?? "",
      name: (payload.name as string | undefined) ?? null,
    });

    await next();
  } catch {
    return c.json({ error: "Unauthorized: invalid or expired session" }, 401);
  }
});
