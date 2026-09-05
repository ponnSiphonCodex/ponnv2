/**
 * src/db/client.ts
 * สร้าง Drizzle client ผูกกับ D1 binding
 */
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDb>;
export * from "./schema";
