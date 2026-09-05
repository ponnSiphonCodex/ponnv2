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
    origin: ["http://localhost:3000", "https://ponnsth.com", "https://www.ponnsth.com"],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ status: "ok", env: c.env.ENVIRONMENT }));

app.use("/api/*", authMiddleware);
app.route("/api", apiRoutes);

app.onError(onError);
app.notFound((c) => c.json({ error: "Not Found" }, 404));

export default app;
