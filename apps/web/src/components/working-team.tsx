"use client";
import { useEffect, useState } from "react";
import { apiWrite } from "@/lib/offline";
import { Icon } from "./icons";
import { confirmDialog } from "@/lib/confirm";
import { SkelCards } from "./skeleton";

const NAVY = "#001D58", PINK = "#EC186E";
const ROLE_COLOR: Record<string, string> = { PMO: "#001D58", "Product Owner": "#EC186E", "Project Manager": "#D4A017", "Project Co-Ordinator": "#2E7D32", "Working Team": "#6B7280" };
type Member = { id: string; name: string | null; email: string; pm_role: string | null; image: string | null; avatar_url: string | null; active: number; done: number; projects: string[]; products: string[] };
type Roster = { id: number; name: string; responsibility: string | null; pm_role: string | null; project_name: string | null; product_name: string | null };
type Opt = { id: number; name: string };

export function WorkingTeam() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roster, setRoster] = useState<Roster[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<Opt[]>([]);
  const [products, setProducts] = useState<Opt[]>([]);
  const [pmRoles, setPmRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    const d = await (await fetch("/api/team")).json();
    setMembers(d.members ?? []); setRoster(d.roster ?? []); setHidden(new Set(d.hidden ?? []));
    setProjects((d.projects ?? []).map((p: any) => ({ id: p.id, name: p.name }))); setProducts((d.products ?? []).map((p: any) => ({ id: p.id, name: p.name })));
    setPmRoles(d.pmRoles ?? []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function isHidden(kind: string, id: string | number) { return hidden.has(`${kind}:${id}`); }
  async function toggleHide(kind: string, id: string | number) {
    const key = `${kind}:${id}`; const willHide = !hidden.has(key);
    setHidden((s) => { const n = new Set(s); willHide ? n.add(key) : n.delete(key); return n; });
    await apiWrite("/api/team", "PATCH", { targetKind: kind, targetId: id, hidden: willHide });
  }
  async function delRoster(id: number) { if (!(await confirmDialog({ message: "ลบคนนี้ออกจากทีม?", danger: true }))) return; setRoster((r) => r.filter((x) => x.id !== id)); await apiWrite(`/api/team?id=${id}`, "DELETE", {}); }

  const visMembers = members.filter((m) => showHidden || !isHidden("user", m.id));
  const visRoster = roster.filter((r) => showHidden || !isHidden("roster", r.id));
  const hiddenCount = members.filter((m) => isHidden("user", m.id)).length + roster.filter((r) => isHidden("roster", r.id)).length;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: "#6B7280" }}>คุณเห็นเฉพาะทีมที่เกี่ยวข้องกับงานของคุณ · กดไอคอน 👁 เพื่อซ่อน/แสดงคน (มีผลเฉพาะมุมมองของคุณ)</div>
        <div style={{ display: "flex", gap: 8 }}>
          {hiddenCount > 0 && <button className="btn-ghost" onClick={() => setShowHidden((v) => !v)}>{showHidden ? "ซ่อนคนที่ปิดไว้" : `แสดงคนที่ปิดไว้ (${hiddenCount})`}</button>}
          <button className="btn-pink" onClick={() => setAddOpen(true)}>+ เพิ่มคนในทีม</button>
        </div>
      </div>

      {loading && <SkelCards n={6} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
        {!loading && visMembers.length === 0 && visRoster.length === 0 && <div className="card" style={{ padding: 20, color: "#6B7280" }}>ยังไม่มีสมาชิกทีมในมุมมองของคุณ</div>}
        {visMembers.map((u) => {
          const rc = ROLE_COLOR[u.pm_role ?? ""] ?? "#6B7280"; const avatar = u.image || u.avatar_url; const hid = isHidden("user", u.id);
          return (
            <div key={u.id} className="card" style={{ padding: 18, opacity: hid ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                {avatar ? <img src={avatar} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover" }} /> : <div style={{ width: 46, height: 46, borderRadius: "50%", background: rc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{(u.name || u.email).charAt(0).toUpperCase()}</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: NAVY, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email}</div>
                  <span className="badge" style={{ background: rc, color: "#fff" }}>{u.pm_role}</span>
                </div>
                <button className="icon-btn" title={hid ? "แสดง" : "ซ่อนจากมุมมองของฉัน"} onClick={() => toggleHide("user", u.id)} style={eye}>{hid ? "🙈" : "👁"}</button>
              </div>
              <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                <div><div style={{ fontSize: 22, fontWeight: 700, color: PINK }}>{u.active}</div><div style={{ fontSize: 11.5, color: "#6B7280" }}>งานค้าง</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 700, color: "#2E7D32" }}>{u.done}</div><div style={{ fontSize: 11.5, color: "#6B7280" }}>เสร็จแล้ว</div></div>
              </div>
              {u.products.length > 0 && <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>📦 ดูแล: {u.products.join(", ")}</div>}
              {u.projects.length > 0 && <div style={{ fontSize: 12, color: "#374151" }}>📁 โครงการ: {u.projects.join(", ")}</div>}
              {u.products.length === 0 && u.projects.length === 0 && <div style={{ fontSize: 12, color: "#9AA0A6" }}>ยังไม่ได้รับมอบหมายโครงการ</div>}
            </div>
          );
        })}
        {visRoster.map((r) => {
          const rc = ROLE_COLOR[r.pm_role ?? ""] ?? "#9AA0A6"; const hid = isHidden("roster", r.id);
          return (
            <div key={`r${r.id}`} className="card" style={{ padding: 18, opacity: hid ? 0.55 : 1, borderStyle: "dashed" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <div style={{ width: 46, height: 46, borderRadius: "50%", background: rc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{r.name.charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: NAVY }}>{r.name} <span style={{ fontSize: 10.5, color: "#9AA0A6", fontWeight: 500 }}>(ไม่ได้ login)</span></div>
                  {r.pm_role && <span className="badge" style={{ background: rc, color: "#fff" }}>{r.pm_role}</span>}
                </div>
                <button className="icon-btn" title={hid ? "แสดง" : "ซ่อน"} onClick={() => toggleHide("roster", r.id)} style={eye}>{hid ? "🙈" : "👁"}</button>
                <button className="icon-btn" title="ลบ" onClick={() => delRoster(r.id)} style={{ ...eye, color: "#DC2626" }}><Icon name="close" size={15} /></button>
              </div>
              {r.responsibility && <div style={{ fontSize: 12.5, color: "#374151", marginBottom: 4 }}>รับผิดชอบ: {r.responsibility}</div>}
              {r.product_name && <div style={{ fontSize: 12, color: "#374151" }}>📦 {r.product_name}</div>}
              {r.project_name && <div style={{ fontSize: 12, color: "#374151" }}>📁 {r.project_name}</div>}
            </div>
          );
        })}
      </div>

      {addOpen && <AddModal projects={projects} products={products} pmRoles={pmRoles} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />}
    </div>
  );
}

function AddModal({ projects, products, pmRoles, onClose, onSaved }: { projects: Opt[]; products: Opt[]; pmRoles: string[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(""); const [resp, setResp] = useState(""); const [role, setRole] = useState(""); const [pj, setPj] = useState(""); const [pd, setPd] = useState(""); const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!name.trim()) { setErr("กรอกชื่อ"); return; }
    setSaving(true); setErr(null);
    const r = await apiWrite("/api/team", "POST", { name, responsibility: resp || null, pmRole: role || null, projectId: pj ? Number(pj) : null, productId: pd ? Number(pd) : null });
    setSaving(false);
    if (r.ok || r.queued) onSaved(); else setErr(r.error || "เพิ่มไม่สำเร็จ");
  }
  return (
    <div style={overlay}>
      <div className="card" style={{ width: "min(440px,94vw)", padding: 22 }}>
        <h3 style={{ marginTop: 0, color: NAVY }}>เพิ่มคนในทีม (ไม่ต้อง login)</h3>
        <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>ใส่ชื่อคนที่รับผิดชอบงานได้ แม้เขาไม่ได้เข้าระบบ เพื่อให้เห็นภาพทีมครบ</div>
        {err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <L label="ชื่อ *"><input className="input" placeholder="Xxxxx" value={name} onChange={(e) => setName(e.target.value)} /></L>
          <L label="รับผิดชอบอะไร"><input className="input" placeholder="Xxxxx" value={resp} onChange={(e) => setResp(e.target.value)} /></L>
          <L label="บทบาท PM"><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">— ไม่ระบุ —</option>{pmRoles.map((r) => <option key={r}>{r}</option>)}</select></L>
          <L label="Product"><select className="input" value={pd} onChange={(e) => setPd(e.target.value)}><option value="">— ไม่ระบุ —</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
          <L label="Project"><select className="input" value={pj} onChange={(e) => setPj(e.target.value)}><option value="">— ไม่ระบุ —</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={submit} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
const eye: React.CSSProperties = { background: "transparent", border: "1px solid #E5E7EB", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };
