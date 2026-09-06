"use client";
import { useEffect, useState } from "react";
import { CrudManager } from "./crud-manager";
import { Icon } from "./icons";

const NAVY = "#001D58";
type Opt = { id: number | string; name: string };

export function RisksTab() {
  const [showExport, setShowExport] = useState(false);
  const [projects, setProjects] = useState<Opt[]>([]);
  useEffect(() => { fetch("/api/ref/projects").then((r) => r.json()).then((j) => setProjects((j.options ?? []).map((o: any) => ({ id: o.id, name: o.label })))).catch(() => {}); }, []);
  return (
    <div>
      {/* v28 (ข้อ 4): Export Excel สำหรับ Risks — ชิดขวา */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "20px 24px 0" }}>
        <button className="btn-ghost" onClick={() => setShowExport(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="table" size={16} /> Export Excel</button>
      </div>
      <CrudManager entity="risks" />
      {showExport && <RiskExportModal projects={projects} onClose={() => setShowExport(false)} />}
    </div>
  );
}

function RiskExportModal({ projects, onClose }: { projects: Opt[]; onClose: () => void }) {
  const [projectId, setProjectId] = useState(""); const [status, setStatus] = useState(""); const [months, setMonths] = useState("12");
  function doExport() {
    const p = new URLSearchParams();
    if (projectId) p.set("projectId", projectId);
    if (status) p.set("status", status);
    p.set("months", months);
    window.location.href = `/api/risks/export?${p.toString()}`;
    onClose();
  }
  return (
    <div style={overlay}>
      <div className="card" style={{ width: "min(440px,94vw)", padding: 22 }}>
        <h3 style={{ marginTop: 0, color: NAVY }}>Export Risks → Excel</h3>
        <div style={{ fontSize: 12.5, color: "#6B7280", marginBottom: 14 }}>เลือกตัวกรองก่อนดาวน์โหลด</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <L label="โครงการ (Project) — ค่าเริ่มต้น"><select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">ทุกโครงการ</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></L>
          <L label="สถานะ"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">ทั้งหมด</option><option>Open</option><option>Mitigating</option><option>Closed</option></select></L>
          <L label="ระยะเวลาย้อนหลัง"><select className="input" value={months} onChange={(e) => setMonths(e.target.value)}><option value="3">3 เดือน</option><option value="6">6 เดือน</option><option value="12">1 ปี (ค่าเริ่มต้น)</option><option value="24">2 ปี</option><option value="120">ทั้งหมด</option></select></L>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={doExport}>ดาวน์โหลด CSV</button></div>
      </div>
    </div>
  );
}
function L({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 16 };
