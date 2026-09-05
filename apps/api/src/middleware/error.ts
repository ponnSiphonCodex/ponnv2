/**
 * apps/api/src/middleware/error.ts
 * Global error handler — กันไม่ให้ D1/Drizzle error หลุดออกไปเป็น 500 ดิบ ๆ
 */
import type { ErrorHandler } from "hono";
import type { AppEnv } from "../types";

export const onError: ErrorHandler<AppEnv> = (err, c) => {
  console.error(`[api-error] ${c.req.method} ${c.req.path} ::`, err);

  const isProd = c.env.ENVIRONMENT === "production";
  return c.json(
    {
      error: "Internal Server Error",
      message: isProd ? undefined : err.message,
    },
    500
  );
};
