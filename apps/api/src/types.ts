/**
 * apps/api/src/types.ts
 * Bindings = ผูกกับ wrangler.toml (D1 / secrets)
 * Variables = ค่าที่ middleware set เข้า context (c.set / c.get)
 */
export type Bindings = {
  DB: D1Database;
  AUTH_SECRET: string; // ต้อง "เหมือนกัน" กับ apps/web (ใช้ verify JWT session)
  ENVIRONMENT: "development" | "production";
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type Variables = {
  user: AuthUser;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
