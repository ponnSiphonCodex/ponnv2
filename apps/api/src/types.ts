export type Bindings = { DB: D1Database; AUTH_SECRET: string; ENVIRONMENT: "development" | "production"; };
export type AuthUser = { id: string; email: string; name?: string | null };
export type Variables = { user: AuthUser };
export type AppEnv = { Bindings: Bindings; Variables: Variables };
