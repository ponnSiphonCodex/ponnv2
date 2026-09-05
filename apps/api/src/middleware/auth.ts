import { jwtVerify } from "jose";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types";

const DEV_COOKIE = "authjs.session-token";
const PROD_COOKIE = "__Secure-authjs.session-token";

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, PROD_COOKIE) ?? getCookie(c, DEV_COOKIE);
  if (!token) return c.json({ error: "Unauthorized: missing session token" }, 401);

  try {
    const secret = new TextEncoder().encode(c.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    if (!payload.sub) return c.json({ error: "Unauthorized: malformed session token" }, 401);

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
