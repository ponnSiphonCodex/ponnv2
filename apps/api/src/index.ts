/**
 * apps/api/src/index.ts
 * Entry point ของ Cloudflare Worker (Hono) — deploy แยกจาก apps/web
 * Public: /health
 * Protected (ต้องมี session cookie จาก apps/web): /api/*
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
    // ปรับ origin ให้ตรงกับโดเมนจริงของ apps/web (Cloudflare Pages)
    origin: ["http://localhost:3000", "https://ponnsth.com", "https://www.ponnsth.com"],
    credentials: true, // จำเป็น เพราะ session อยู่ใน cookie ข้าม service
  })
);

app.get("/health", (c) => c.json({ status: "ok", env: c.env.ENVIRONMENT }));

// ทุก route ใต้ /api ต้องผ่าน auth middleware (verify JWT session ที่ apps/web ออกให้)
app.use("/api/*", authMiddleware);
app.route("/api", apiRoutes);

app.onError(onError);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
