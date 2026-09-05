import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { projects, themes, createDb } from "../db";
import type { AppEnv } from "../types";
import { computeProjectAutoDates, computeProjectProgress } from "../lib/progress";

export const projectRoutes = new Hono<AppEnv>();

projectRoutes.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const rows = await db
    .select({ id: projects.id, name: projects.name, status: projects.status, themeId: projects.themeId, themeName: themes.name })
    .from(projects)
    .leftJoin(themes, eq(projects.themeId, themes.id));

  const result = await Promise.all(
    rows.map(async (p) => ({ ...p, progress: await computeProjectProgress(db, p.id), autoDates: await computeProjectAutoDates(db, p.id) }))
  );

  return c.json({ projects: result });
});

projectRoutes.post("/", async (c) => {
  const db = createDb(c.env.DB);
  const body = await c.req.json<{ name: string; status?: string; themeId?: number }>();
  const user = c.get("user");
  if (!body.name?.trim()) return c.json({ error: "name ห้ามว่าง" }, 400);

  const [created] = await db
    .insert(projects)
    .values({ name: body.name.trim(), status: body.status ?? "planning", themeId: body.themeId, createdBy: user.id, updatedBy: user.id })
    .returning();

  return c.json({ project: created }, 201);
});

projectRoutes.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "id ต้องเป็นตัวเลข" }, 400);

  const db = createDb(c.env.DB);
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return c.json({ error: "ไม่พบ Project นี้" }, 404);

  const [progress, autoDates] = await Promise.all([computeProjectProgress(db, id), computeProjectAutoDates(db, id)]);
  return c.json({ project, progress, autoDates });
});
