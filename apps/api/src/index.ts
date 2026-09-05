/**
 * apps/api/src/index.ts
 * Entry point ของ Cloudflare Worker (Hono)
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { AppEnv } from "./types";
import { authMiddleware } from "./middleware/auth";
import { onError } from "./middleware/error";
import { apiRoutes } from "./routes";

const app = new Hono<AppEnv>();

app.use("*", logger());
app.use(
  "*",
  cors({
    // อัปเดตตาม custom domain จริง: web = pm.ponnsth.com, api = apix.ponnsth.com
    // (ไม่ได้ใช้ CORS จริงจังเพราะ board page เรียก API แบบ server-to-server
    // ไม่ใช่ browser fetch ตรง แต่คงไว้เผื่ออนาคตมี client-side call)
    origin: [
      "http://localhost:3000",
      "https://ponnsth.com",
      "https://www.ponnsth.com",
      "https://pm.ponnsth.com",
    ],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok", env: c.env.ENVIRONMENT }));

app.use("/api/*", authMiddleware);
app.route("/api", apiRoutes);

app.onError(onError);
app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
