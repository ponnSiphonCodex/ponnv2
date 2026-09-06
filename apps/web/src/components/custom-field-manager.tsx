"use client";
import { useEffect, useState, useCallback } from "react";
import { confirmDialog } from "@/lib/confirm";
const NAVY = "#001D58";
const REF_TYPES = ["task", "project", "feature"];
const TYPES = ["Text", "Number", "Date", "Dropdown", "Checkbox"];
export function CustomFieldManager({ canWrite }: { canWrite: boolean }) {
  const [defs, setDefs] = useState<any[]>([]);
  const [name, setName] = useState(""); const [ref, setRef] = useState("task"); const [type, setType] = useState("Text"); const [options, setOptions] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(async () => { const r = await fetch("/api/custom-fields"); if (r.ok) { const d = await r.json(); setDefs(d.defs); } }, []);
  useEffect(() => { load(); }, [load]);
  async function add() {
    if (!name.trim()) { setErr("กรอกชื่อ field"); return; }
    setErr(null);
    const r = await fetch("/api/custom-fields", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, referenceType: ref, fieldType: type, options: type === "Dropdown" ? options : null }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "เพิ่มไม่สำเร็จ"); return; }
    setName(""); setOptions(""); load();
  }
  async function del(id: number) { if (!(await confirmDialog({ message: "ลบ Custom Field นี้?", danger: true }))) return; await fetch(`/api/custom-fields?id=${id}`, { method: "DELETE" }); load(); }
  return (
    <div style={{ padding: 24 }}>
      {canWrite && (
        <div className="card" style={{ padding: 16, marginBottom: 18 }}>
          <h3 style={{ marginTop: 0, color: NAVY, fontSize: 15 }}>เพิ่ม Custom Field</h3>
          {err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 8, borderRadius: 8, marginBottom: 10, fontSize: 13 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <L label="ชื่อ Field"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></L>
            <L label="ใช้กับ"><select className="input" value={ref} onChange={(e) => setRef(e.target.value)}>{REF_TYPES.map((r) => <option key={r}>{r}</option>)}</select></L>
            <L label="ชนิด"><select className="input" value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></L>
            {type === "Dropdown" && <L label="ตัวเลือก (คั่นด้วย ,)"><input className="input" value={options} onChange={(e) => setOptions(e.target.value)} placeholder="A,B,C" /></L>}
            <button className="btn-pink" onClick={add}>+ เพิ่ม</button>
          </div>
        </div>
      )}
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}><th style={th}>ID</th><th style={th}>ชื่อ</th><th style={th}>ใช้กับ</th><th style={th}>ชนิด</th><th style={th}>ตัวเลือก</th>{canWrite && <th style={th}></th>}</tr></thead>
          <tbody>
            {defs.length === 0 && <tr><td colSpan={6} style={{ ...td, color: "#9AA0A6" }}>ยังไม่มี custom field</td></tr>}
            {defs.map((d) => (
              <tr key={d.id} style={{ borderTop: "1px solid #F0F1F3" }}>
                <td style={{ ...td, color: "#9AA0A6" }}>{d.id}</td><td style={td}>{d.name}</td><td style={td}>{d.reference_type}</td><td style={td}>{d.field_type}</td><td style={{ ...td, fontSize: 12.5, color: "#6B7280" }}>{d.options ?? "—"}</td>
                {canWrite && <td style={td}><button onClick={() => del(d.id)} style={{ border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>ลบ</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 12, fontWeight: 600, color: "#6B7280" }}>{label}</span>{children}</label>; }
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, color: "#6B7280", fontWeight: 600 };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: 13.5 };
