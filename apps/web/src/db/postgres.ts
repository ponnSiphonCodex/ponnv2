import postgres, { type Sql } from "postgres";

let client: Sql | null = null;
let activeUrl = "";

function connection(databaseUrl: string): Sql {
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  if (!client || activeUrl !== databaseUrl) {
    activeUrl = databaseUrl;
    client = postgres(databaseUrl, {
      prepare: false,
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      ssl: "require",
    });
  }
  return client;
}

function translate(source: string): string {
  let q = source.trim();
  q = q.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
  q = q.replace(/unixepoch\(\)/gi, "EXTRACT(EPOCH FROM NOW())::bigint");
  q = q.replace(/\bCOLLATE\s+NOCASE\b/gi, "");
  q = q.replace(/\?/g, (() => { let n = 0; return () => `$${++n}`; })());
  if (/^INSERT\s+INTO/i.test(q) && /\b(task_tags|team_hidden)\b/i.test(q) && !/ON\s+CONFLICT/i.test(q)) q += " ON CONFLICT DO NOTHING";
  if (/^INSERT\s+INTO/i.test(q) && !/\bRETURNING\b/i.test(q)) q += " RETURNING id";
  return q;
}

class Statement {
  private params: unknown[] = [];
  constructor(private databaseUrl: string, private source: string) {}
  bind(...params: unknown[]) { this.params = params; return this; }
  private async execute() { return connection(this.databaseUrl).unsafe(translate(this.source), this.params as any[]); }
  async all<T = Record<string, unknown>>() {
    const rows = await this.execute();
    return { results: Array.from(rows) as T[], success: true, meta: { changes: rows.count ?? rows.length } };
  }
  async first<T = Record<string, unknown>>() {
    const rows = await this.execute();
    return (rows[0] ?? null) as T | null;
  }
  async run() {
    const rows = await this.execute();
    return { success: true, results: Array.from(rows), meta: { changes: rows.count ?? rows.length, last_row_id: (rows[0] as any)?.id ?? 0 } };
  }
}

export class SupabaseDatabase {
  constructor(private databaseUrl: string) {}
  prepare(query: string) { return new Statement(this.databaseUrl, query); }
  async batch(statements: Statement[]) { return Promise.all(statements.map((s) => s.run())); }
  async exec(query: string) { const rows = await connection(this.databaseUrl).unsafe(translate(query)); return { count: rows.count ?? rows.length }; }
}

export type Database = SupabaseDatabase;
export function createDatabase(env: Pick<CloudflareEnv, "DATABASE_URL">): Database {
  return new SupabaseDatabase(env.DATABASE_URL);
}
