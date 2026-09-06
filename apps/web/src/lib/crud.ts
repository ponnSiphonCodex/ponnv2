import type { DbClient } from "@/db";
import { entityDef, dbColumns, dateColumns, type EntityDef } from "./entities";
function dateToUnix(v: unknown): number | null { if (v === null || v === undefined || v === "") return null; if (typeof v === "number") return v; const s = String(v); const ms = Date.parse(s.length === 10 ? s + "T00:00:00Z" : s); return Number.isNaN(ms) ? null : Math.floor(ms / 1000); }
function unixToDate(v: unknown): string | null { if (v === null || v === undefined) return null; const n = Number(v); if (!Number.isFinite(n)) return null; return new Date(n * 1000).toISOString().slice(0, 10); }
function coerce(def: EntityDef, key: string, value: unknown): unknown {
  const f = def.fields.find((x) => x.key === key); if (!f) return value;
  if (value === "" || value === undefined) return null;
  if (f.type === "date") return dateToUnix(value);
  if (f.type === "number") return value === null ? null : Number(value);
  if (f.type === "ref") { if (value === null) return null; return f.refEntity === "users" ? String(value) : Number(value); }
  return value;
}
export async function crudList(db: DbClient, name: string, projectFilter?: number[] | null): Promise<Record<string, unknown>[]> {
  const def = entityDef(name); if (!def) throw new Error("unknown entity");
  const order = def.defaultOrder ?? "id DESC";
  let sql = `SELECT * FROM ${def.table}`;
  const binds: any[] = [];
  if (def.scoped && projectFilter && projectFilter.length >= 0) {
    if (projectFilter.length === 0) return [];
    sql += ` WHERE id IN (${projectFilter.map(() => "?").join(",")})`; binds.push(...projectFilter);
  }
  sql += ` ORDER BY ${order}`;
  const res = await db.prepare(sql).bind(...binds).all();
  const rows = (res.results ?? []) as Record<string, unknown>[];
  const dcols = dateColumns(def);
  for (const r of rows) for (const c of dcols) r[c] = unixToDate(r[c]);
  return rows;
}
export async function crudCreate(db: DbClient, name: string, body: Record<string, unknown>, userId: string): Promise<number> {
  const def = entityDef(name); if (!def) throw new Error("unknown entity");
  const cols = dbColumns(def).filter((c) => c in body); if (!cols.length) throw new Error("no fields");
  const vals = cols.map((c) => coerce(def, c, body[c]));
  const allCols = [...cols, "created_by", "updated_by"]; const allVals = [...vals, userId, userId];
  const sql = `INSERT INTO ${def.table} (${allCols.join(", ")}) VALUES (${allCols.map(() => "?").join(", ")})`;
  const res = await db.prepare(sql).bind(...allVals).run();
  return Number(res.meta?.last_row_id ?? 0);
}
export async function crudUpdate(db: DbClient, name: string, id: number, body: Record<string, unknown>, userId: string): Promise<void> {
  const def = entityDef(name); if (!def) throw new Error("unknown entity");
  const cols = dbColumns(def).filter((c) => c in body); if (!cols.length) return;
  const setParts = cols.map((c) => `${c} = ?`); const vals = cols.map((c) => coerce(def, c, body[c]));
  setParts.push("updated_by = ?", "updated_at = unixepoch()"); vals.push(userId);
  await db.prepare(`UPDATE ${def.table} SET ${setParts.join(", ")} WHERE id = ?`).bind(...vals, id).run();
}
export async function crudDelete(db: DbClient, name: string, id: number): Promise<void> {
  const def = entityDef(name); if (!def) throw new Error("unknown entity");
  await db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).bind(id).run();
}
export async function refOptions(db: DbClient, name: string): Promise<{ id: string | number; label: string }[]> {
  if (name === "users") { const res = await db.prepare(`SELECT id, COALESCE(name, email) AS label FROM users WHERE active = 1 ORDER BY email`).all(); return (res.results ?? []) as any; }
  const def = entityDef(name); if (!def) return [];
  const labelCol = def.table === "requirements" ? "title" : "name";
  const res = await db.prepare(`SELECT id, ${labelCol} AS label FROM ${def.table} ORDER BY id`).all();
  return (res.results ?? []) as any;
}
