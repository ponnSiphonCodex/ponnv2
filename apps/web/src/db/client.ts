export type RpcResult = { rows?: Record<string, unknown>[]; changes?: number; last_row_id?: number | string | null };

function sqlCompat(sql: string): string {
  return sql
    .replace(/unixepoch\(\)/gi, "EXTRACT(EPOCH FROM NOW())::bigint")
    .replace(/\bCOLLATE\s+NOCASE\b/gi, "")
    .replace(/\bLIKE\b/gi, "ILIKE");
}

class Statement {
  private params: unknown[] = [];
  constructor(private env: Pick<CloudflareEnv, "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">, private sql: string) {}
  bind(...params: unknown[]) { this.params = params; return this; }
  private async exec(): Promise<RpcResult> {
    const base = this.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const key = this.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!base || !key) throw new Error("Supabase environment is incomplete");
    const response = await fetch(`${base}/rest/v1/rpc/pm_execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ statement: sqlCompat(this.sql), params: this.params }),
    });
    const raw = await response.text();
    let data: any = {}; try { data = raw ? JSON.parse(raw) : {}; } catch { data = { message: raw }; }
    if (!response.ok) throw new Error(`Supabase Data API ${response.status}: ${data.message || data.error || raw || "request failed"}`);
    return data ?? {};
  }
  async all<T = Record<string, unknown>>() { const r = await this.exec(); return { results: (r.rows ?? []) as T[], success: true, meta: { changes: Number(r.changes ?? 0) } }; }
  async first<T = Record<string, unknown>>() { const r = await this.exec(); return ((r.rows ?? [])[0] ?? null) as T | null; }
  async run() { const r = await this.exec(); return { success: true, results: r.rows ?? [], meta: { changes: Number(r.changes ?? 0), last_row_id: Number(r.last_row_id ?? 0) } }; }
}

export class SupabaseDatabase {
  constructor(private env: Pick<CloudflareEnv, "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">) {}
  prepare(sql: string) { return new Statement(this.env, sql); }
  async batch(statements: Statement[]) { return Promise.all(statements.map((s) => s.run())); }
}
export type DbClient = SupabaseDatabase;
export function createDb(env: Pick<CloudflareEnv, "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">): DbClient { return new SupabaseDatabase(env); }
