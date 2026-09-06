"use client";
import { useEffect, useState, useCallback } from "react";
import { ENTITIES, type Field } from "@/lib/entities";
import { apiWrite, saveDraft, loadDraft, clearDraft, initOfflineSync } from "@/lib/offline";

const NAVY = "#001D58";
type Row = Record<string, any>;
type RefMap = Record<string, { id: string | number; label: string }[]>;

export function CrudManager({ entity }: { entity: string }) {
  const def = ENTITIES[entity];
  const [rows, setRows] = useState<Row[]>([]);
  const [refs, setRefs] = useState<RefMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  // reload เฉพาะแถว (ใช้หลัง save/delete) — ไม่ดึง ref ซ้ำ
  const loadRows = useCallback(async () => {
    try {
      const res = await fetch(`/api/crud/${entity}`);
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError(j.error || "โหลดข้อมูลไม่สำเร็จ"); return; }
      const d = await res.json(); setRows(d.rows || []); setCanWrite(!!d.canWrite);
    } catch { setError("เชื่อมต่อไม่สำเร็จ"); }
  }, [entity]);

  // โหลดครั้งแรก: rows + refs พร้อมกัน
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const refFields = def.fields.filter((f) => f.type === "ref");
      const uniq = Array.from(new Set(refFields.map((f) => f.refEntity!)));
      const [rowsRes, ...refResults] = await Promise.all([
        fetch(`/api/crud/${entity}`),
        ...uniq.map((re) => fetch(`/api/ref/${re}`).then((r) => r.ok ? r.json() : { options: [] }).then((j) => ({ re, options: j.options || [] }))),
      ]);
      if (!rowsRes.ok) { const j = await rowsRes.json().catch(() => ({})); setError(j.error || "โหลดข้อมูลไม่สำเร็จ"); setLoading(false); return; }
      const d = await rowsRes.json(); setRows(d.rows || []); setCanWrite(!!d.canWrite);
      const map: RefMap = {}; for (const r of refResults as any[]) map[r.re] = r.options;
      setRefs(map);
    } catch { setError("เชื่อมต่อไม่สำเร็จ"); }
    setLoading(false);
  }, [entity, def]);

  useEffect(() => { load(); const cleanup = initOfflineSync((n) => setFlash(`ส่งข้อมูลที่ค้างไว้ ${n} รายการเรียบร้อย`)); return cleanup; }, [load]);

  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function refLabel(f: Field, val: any) { if (val === null || val === undefined || val === "") return "—"; const o = (refs[f.refEntity!] || []).find((x) => String(x.id) === String(val)); return o ? o.label : `#${val}`; }
  function cellText(f: Field, r: Row): string { const v = r[f.key]; if (f.type === "ref") return refLabel(f, v); if (v === null || v === undefined || v === "") return "—"; return String(v); }
  function cell(f: Field, r: Row) {
    const v = r[f.key];
    if (f.key === "color" && typeof v === "string" && v) return <span className="cell-color"><span className="sw" style={{ background: v }} />{v}</span>;
    return cellText(f, r);
  }
  function sortVal(f: Field | null, r: Row): any {
    if (!f) return r.id;
    if (f.type === "ref") return refLabel(f, r[f.key]);
    const v = r[f.key];
    if (f.type === "number") return Number(v) || 0;
    return (v ?? "").toString().toLowerCase();
  }
  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function remove(id: number) {
    if (!confirm("ลบรายการนี้?")) return;
    const r = await apiWrite(`/api/crud/${entity}/${id}`, "DELETE", {});
    if (!r.ok && !r.queued) { alert(r.error || "ลบไม่สำเร็จ"); return; }
    if (r.queued) setFlash(r.error!); loadRows();
  }

  const listFields = def.fields.filter((f) => f.listShow);
  const term = q.trim().toLowerCase();
  const filtered = term ? rows.filter((r) => listFields.some((f) => cellText(f, r).toLowerCase().includes(term)) || String(r.id).includes(term)) : rows;
  const sortField = sortKey === "id" ? null : listFields.find((f) => f.key === sortKey) ?? null;
  const sorted = [...filtered].sort((a, b) => { const x = sortVal(sortField, a), y = sortVal(sortField, b); const c = x < y ? -1 : x > y ? 1 : 0; return sortDir === "asc" ? c : -c; });
  const arrow = (key: string) => <span className="arr">{sortKey === key ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}</span>;
  return (
    <div style={{ padding: 24 }}>
      {flash && <div style={{ background: "#EFF6FF", color: "#1D4ED8", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{flash}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        {canWrite ? <button className="btn-pink" onClick={() => setCreating(true)}>+ เพิ่ม {def.label}</button> : <span />}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`ค้นหาใน ${def.label}...`} className="input" style={{ width: 260, maxWidth: "60vw" }} />
      </div>
      {!canWrite && !loading && <div style={{ background: "#FFFBEB", color: "#92400E", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>คุณดูได้อย่างเดียว (ไม่มีสิทธิ์แก้ไขส่วนนี้)</div>}
      {error && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 12, borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <div className="card md-scroll">
        <table>
          <thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}>
            <th className={`sortable ${sortKey === "id" ? "active" : ""}`} style={th} onClick={() => toggleSort("id")}>ID {arrow("id")}</th>
            {listFields.map((f) => <th key={f.key} className={`sortable ${sortKey === f.key ? "active" : ""}`} style={th} onClick={() => toggleSort(f.key)}>{f.label} {arrow(f.key)}</th>)}
            {canWrite && <th style={th}></th>}
          </tr></thead>
          <tbody>
            {loading && <tr><td colSpan={listFields.length + 2} style={{ ...td, color: "#6B7280" }}>กำลังโหลด...</td></tr>}
            {!loading && sorted.length === 0 && <tr><td colSpan={listFields.length + 2} style={{ ...td, color: "#6B7280" }}>{term ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีข้อมูล"}</td></tr>}
            {sorted.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #F0F1F3" }}>
                <td style={{ ...td, color: "#9AA0A6" }}>{r.id}</td>
                {listFields.map((f) => <td key={f.key} style={td}>{cell(f, r)}</td>)}
                {canWrite && <td style={{ ...td, whiteSpace: "nowrap" }}><button className="btn-ghost" onClick={() => setEditing(r)} style={{ padding: "5px 10px", marginRight: 6 }}>แก้ไข</button><button onClick={() => remove(r.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", cursor: "pointer" }}>ลบ</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(creating || editing) && <EntityForm entity={entity} refs={refs} initial={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={(q) => { setCreating(false); setEditing(null); if (q) setFlash(q); loadRows(); }} />}
    </div>
  );
}

function EntityForm({ entity, refs, initial, onClose, onSaved }: { entity: string; refs: RefMap; initial: Row | null; onClose: () => void; onSaved: (queuedMsg?: string) => void }) {
  const def = ENTITIES[entity];
  const draftKey = `${entity}:${initial ? initial.id : "new"}`;
  const [form, setForm] = useState<Row>(() => {
    const draft = loadDraft<Row>(draftKey);
    if (draft) return draft;
    const base: Row = {}; for (const f of def.fields) base[f.key] = initial ? (initial[f.key] ?? "") : ""; return base;
  });
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { saveDraft(draftKey, form); }, [form, draftKey]);
  function set(k: string, v: any) { setForm((s) => ({ ...s, [k]: v })); }

  async function submit() {
    setSaving(true); setErr(null);
    const payload: Row = {}; for (const f of def.fields) { let v = form[f.key]; if (v === "") v = null; payload[f.key] = v; }
    const url = initial ? `/api/crud/${entity}/${initial.id}` : `/api/crud/${entity}`;
    const r = await apiWrite(url, initial ? "PATCH" : "POST", payload);
    setSaving(false);
    if (r.ok) { clearDraft(draftKey); onSaved(); return; }
    if (r.queued) { clearDraft(draftKey); onSaved(r.error!); return; }
    setErr(r.error || "บันทึกไม่สำเร็จ");
  }
  return (
    <div style={overlay}>{/* v27: ไม่ปิดเมื่อคลิกพื้นหลัง (กันปิดพลาดตอนกรอกข้อมูล) — ปิดด้วยปุ่มยกเลิกเท่านั้น */}
      <div className="card" style={{ width: "min(560px,94vw)", maxHeight: "88vh", overflowY: "auto", padding: 22 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, color: NAVY }}>{initial ? "แก้ไข" : "เพิ่ม"} {def.label}</h3>
        {err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {def.fields.map((f) => (
            <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{f.label}{f.required && <span style={{ color: "#EC186E" }}> *</span>}</span>
              {f.key === "color" ? <ColorSelect value={form[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
                : f.key === "level" ? <select className="input" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}><option value="">— เลือก —</option>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}</select>
                : f.type === "textarea" ? <textarea className="input" style={{ height: 80, padding: 10 }} placeholder="Xxxxx" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                : f.type === "select" ? <select className="input" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}><option value="">— เลือก —</option>{(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}</select>
                : f.type === "ref" ? <select className="input" value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}><option value="">— เลือก —</option>{(refs[f.refEntity!] || []).map((o) => <option key={String(o.id)} value={String(o.id)}>{o.label}</option>)}</select>
                : <input className="input" type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} placeholder={f.type === "text" ? "Xxxxx" : undefined} value={form[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />}
            </label>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 18, gap: 8 }}>
          <button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      </div>
    </div>
  );
}
const SHADES = ["#001D58","#EC186E","#D4A017","#2E7D32","#6B7280","#9AA0A6","#1D4ED8","#0891B2","#7C3AED","#DB2777","#DC2626","#EA580C","#CA8A04","#65A30D","#059669","#0D9488","#4F46E5","#9333EA","#BE185D","#334155"];
function ColorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="input" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "left" }}>
        <span className="color-swatch" style={{ background: value || "#fff" }} />{value || "— เลือกสี —"}
      </button>
      {open && (<><div style={{ position: "fixed", inset: 0, zIndex: 60 }} onClick={() => setOpen(false)} />
        <div className="card" style={{ position: "absolute", top: 44, left: 0, zIndex: 61, padding: 10, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, width: 240, boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}>
          {SHADES.map((c) => <button key={c} type="button" title={c} onClick={() => { onChange(c); setOpen(false); }} style={{ width: 36, height: 30, borderRadius: 6, border: value === c ? "2px solid #001D58" : "1px solid #E5E7EB", background: c, cursor: "pointer" }} />)}
        </div></>)}
    </div>
  );
}
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, color: "#6B7280", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: 13.5 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 };
