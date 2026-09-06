"use client";
import { useEffect, useMemo, useState } from "react";
import { apiWrite } from "@/lib/offline";
import { Icon } from "./icons";
import { confirmDialog } from "@/lib/confirm";
import { SkelRows } from "./skeleton";

const NAVY = "#001D58", PINK = "#EC186E";
type Issue = { id: number; title: string; status: string; project_id: number | null; project_name: string | null; product_id: number | null; product_name: string | null; raised_by: string | null; raiser_name: string | null; actioner_name: string | null; updated_at: number };
type Opt = { id: number | string; name: string };
type Meta = { projects: Opt[]; products: Opt[]; users: Opt[]; statuses: string[]; isPmo: boolean; meId: string };
const fmt = (u: number) => new Date(u * 1000).toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).slice(0, 16);
const STATUS_COLOR: Record<string, string> = { Open: "#DC2626", "In Progress": "#D4A017", Closed: "#16A34A" };

export function IssuesView() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [meta, setMeta] = useState<Meta>({ projects: [], products: [], users: [], statuses: [], isPmo: false, meId: "" });
  const [loading, setLoading] = useState(true);
  const [fProject, setFProject] = useState(""); const [fProduct, setFProduct] = useState(""); const [fStatus, setFStatus] = useState(""); const [fRaiser, setFRaiser] = useState("");
  const [q, setQ] = useState("");
  const [showExport, setShowExport] = useState(false);

  async function load() { setLoading(true); const d = await (await fetch("/api/issues/list")).json(); setIssues(d.issues ?? []); setMeta(d.meta ?? meta); setLoading(false); }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return issues.filter((i) =>
      (!fProject || String(i.project_id) === fProject) &&
      (!fProduct || String(i.product_id) === fProduct) &&
      (!fStatus || i.status === fStatus) &&
      (!fRaiser || i.raised_by === fRaiser) &&
      (!term || (i.title ?? "").toLowerCase().includes(term)));
  }, [issues, fProject, fProduct, fStatus, fRaiser, q]);

  async function del(id: number) { if (!(await confirmDialog({ message: "ลบ Issue นี้?", danger: true }))) return; setIssues((s) => s.filter((x) => x.id !== id)); await apiWrite(`/api/issues/save?id=${id}`, "DELETE", {}); }
  async function quickStatus(i: Issue, s: string) { setIssues((arr) => arr.map((x) => x.id === i.id ? { ...x, status: s } : x)); await apiWrite("/api/issues/save", "POST", { id: i.id, title: i.title, projectId: i.project_id, status: s }); }
  const clearFilters = () => { setFProject(""); setFProduct(""); setFStatus(""); setFRaiser(""); setQ(""); };
  const active = fProject || fProduct || fStatus || fRaiser || q;

  return (
    <div style={{ padding: 20 }}>
      {/* v28 (ข้อ 4): ปุ่ม Export + เพิ่ม Issue ย้ายไปชิดขวา */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button className="btn-ghost" onClick={() => setShowExport(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="table" size={16} /> Export Excel</button>
        <a href="/pm/issues/edit" className="btn-pink" style={{ textDecoration: "none" }}>+ เพิ่ม Issue</a>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 14, marginBottom: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
        <FL label="ค้นหาหัวข้อ"><input className="input" style={{ width: 200 }} placeholder="พิมพ์คำค้น..." value={q} onChange={(e) => setQ(e.target.value)} /></FL>
        <FL label="By Product"><select className="input" style={{ width: 170 }} value={fProduct} onChange={(e) => setFProduct(e.target.value)}><option value="">ทั้งหมด</option>{meta.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FL>
        <FL label="By Project"><select className="input" style={{ width: 170 }} value={fProject} onChange={(e) => setFProject(e.target.value)}><option value="">ทั้งหมด</option>{meta.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></FL>
        <FL label="By สถานะ"><select className="input" style={{ width: 140 }} value={fStatus} onChange={(e) => setFStatus(e.target.value)}><option value="">ทั้งหมด</option>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select></FL>
        <FL label="By ผู้แจ้ง"><select className="input" style={{ width: 160 }} value={fRaiser} onChange={(e) => setFRaiser(e.target.value)}><option value="">ทั้งหมด</option>{meta.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></FL>
        {active && <button className="btn-ghost" onClick={clearFilters}>ล้างตัวกรอง</button>}
        <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#6B7280" }}>{filtered.length} / {issues.length} รายการ</span>
      </div>

      <div className="card md-scroll">
        <table>
          <thead><tr style={{ background: "#F9FAFB", textAlign: "left" }}><th style={th}>หัวข้อปัญหา</th><th style={th}>Project</th><th style={th}>Product</th><th style={th}>ผู้แจ้ง</th><th style={th}>สถานะ</th><th style={th}>อัปเดต</th><th style={th}></th></tr></thead>
          <tbody>
            {loading && <SkelRows cols={7} />}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ ...td, color: "#9AA0A6" }}>ไม่พบ Issue</td></tr>}
            {filtered.map((i) => (
              <tr key={i.id} style={{ borderTop: "1px solid #F0F1F3" }}>
                <td style={td}><a href={`/pm/issues/edit?id=${i.id}`} style={{ color: NAVY, fontWeight: 600, textDecoration: "none" }}>{i.title}</a></td>
                <td style={{ ...td, fontSize: 12.5 }}>{i.project_name ?? "—"}</td>
                <td style={{ ...td, fontSize: 12.5 }}>{i.product_name ?? "—"}</td>
                <td style={{ ...td, fontSize: 12.5 }}>{i.raiser_name ?? "—"}</td>
                <td style={td}><select value={i.status} onChange={(e) => quickStatus(i, e.target.value)} style={{ border: "none", background: `${STATUS_COLOR[i.status]}18`, color: STATUS_COLOR[i.status], fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "4px 10px", cursor: "pointer" }}>{["Open", "In Progress", "Closed"].map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                <td style={{ ...td, fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>{fmt(i.updated_at)}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <a href={`/pm/issues/edit?id=${i.id}`} className="btn-ghost" style={{ padding: "5px 10px", textDecoration: "none", marginRight: 6 }}>แก้ไข</a>
                  <button onClick={() => del(i.id)} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", cursor: "pointer" }}>ลบ</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showExport && <ExportModal meta={meta} onClose={() => setShowExport(false)} />}
    </div>
  );
}

function ExportModal({ meta, onClose }: { meta: Meta; onClose: () => void }) {
  // Default: filter = Project (dropdown เปิดให้เลือก), ระยะเวลาย้อนหลัง 1 ปี
  const [projectId, setProjectId] = useState(""); const [productId, setProductId] = useState(""); const [status, setStatus] = useState(""); const [months, setMonths] = useState("12");
  function doExport() {
    const p = new URLSearchParams();
    if (projectId) p.set("projectId", projectId);
    if (productId) p.set("productId", productId);
    if (status) p.set("status", status);
    p.set("months", months);
    window.location.href = `/api/issues/export?${p.toString()}`;
    onClose();
  }
  return (
    <div style={overlay}>
      <div className="card" style={{ width: "min(440px,94vw)", padding: 22 }}>
        <h3 style={{ marginTop: 0, color: NAVY }}>Export Issues → Excel</h3>
        <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 14 }}>{meta.isPmo ? "คุณเป็น PMO/Admin — ดาวน์โหลดได้ทั้งหมด" : "ดาวน์โหลดเฉพาะ Issue ที่คุณเกี่ยวข้อง"} · เลือกตัวกรองก่อนดาวน์โหลด</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <L label="โครงการ (Project) — ค่าเริ่มต้น"><select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">ทุกโครงการ</option>{meta.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
          <L label="Product"><select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}><option value="">ทั้งหมด</option>{meta.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
          <L label="สถานะ"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">ทั้งหมด</option>{meta.statuses.map((s) => <option key={s}>{s}</option>)}</select></L>
          <L label="ระยะเวลาย้อนหลัง"><select className="input" value={months} onChange={(e) => setMonths(e.target.value)}><option value="3">3 เดือน</option><option value="6">6 เดือน</option><option value="12">1 ปี (ค่าเริ่มต้น)</option><option value="24">2 ปี</option><option value="120">ทั้งหมด</option></select></L>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={doExport}>ดาวน์โหลด CSV</button></div>
      </div>
    </div>
  );
}

function FL({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 11, fontWeight: 600, color: "#9AA0A6", textTransform: "uppercase", letterSpacing: .3 }}>{label}</span>{children}</label>; }
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
const th: React.CSSProperties = { padding: "11px 14px", fontSize: 12.5, fontWeight: 600, color: "#6B7280", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "11px 14px", fontSize: 13.5 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };
