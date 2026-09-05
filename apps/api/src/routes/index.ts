import { Hono } from "hono";
import type { AppEnv } from "../types";
import { boardRoutes } from "./board";
import { projectRoutes } from "./projects";
import { taskRoutes } from "./tasks";

export const apiRoutes = new Hono<AppEnv>();

apiRoutes.route("/projects", projectRoutes);
apiRoutes.route("/projects", boardRoutes);
apiRoutes.route("/tasks", taskRoutes);
