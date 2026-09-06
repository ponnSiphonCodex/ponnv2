"use client";
import { useEffect, useState } from "react";
import { apiWrite, saveDraft, loadDraft, clearDraft } from "@/lib/offline";

const NAVY = "#001D58";
type Opt = { id: number | string; name: string };
const STATUS = ["Open", "In Progress", "Closed"];

export function IssueEditor({ issueId }: { issueId: number | null }) {
  const draftKey = `issue:${issueId ?? "new"}`;
  const [id, setId] = useState<number | null>(issueId);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("Open");
  const [raisedBy, setRaisedBy] = useState("");
  const [actionedBy, setActionedBy] = useState("");
  const [description, setDescription] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [projects, setProjects] = useState<Opt[]>([]);
  const [users, setUsers] = useState<Opt[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const [pj, us] = await Promise.all([
        fetch("/api/ref/projects").then((r) => r.json()).then((j) => j.options ?? []),
        fetch("/api/ref/users").then((r) => r.json()).then((j) => j.options ?? []),
      ]);
      setProjects(pj.map((o: any) => ({ id: o.id, name: o.label }))); setUsers(us.map((o: any) => ({ id: o.id, name: o.label })));
      if (issueId) {
        const d = await (await fetch(`/api/issues/detail?id=${issueId}`)).json();
        const i = d.issue;
        if (i) { setTitle(i.title ?? ""); setProjectId(i.reference_type === "project" ? String(i.reference_id ?? "") : ""); setStatus(i.status ?? "Open"); setRaisedBy(i.raised_by ?? ""); setActionedBy(i.actioned_by ?? ""); setDescription(i.description ?? ""); setActionPlan(i.action_plan ?? ""); }
      }
      const draft = loadDraft<any>(draftKey);
      if (draft) { if (draft.title) setTitle(draft.title); if (draft.description) setDescription(draft.description); if (draft.actionPlan) setActionPlan(draft.actionPlan); }
      setReady(true);
    }
    init();
  }, []);
  useEffect(() => { if (ready) saveDraft(draftKey, { title, description, actionPlan, projectId, status }); }, [title, description, actionPlan, projectId, status, ready]);

  function flash(ok: boolean, text: string) { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500); }
  async function save(goBack = false) {
    if (!title.trim()) { flash(false, "กรุณากรอกหัวข้อปัญหา"); return; }
    if (!projectId) { flash(false, "กรุณาเลือกโครงการ"); return; }
    setSaving(true);
    const r = await apiWrite("/api/issues/save", "POST", { id, title, projectId: Number(projectId), status, raisedBy: raisedBy || null, actionedBy: actionedBy || null, description, actionPlan });
    setSaving(false);
    if (r.ok || r.queued) { clearDraft(draftKey); if (r.data?.id && !id) setId(r.data.id); flash(true, "บันทึกแล้ว"); if (goBack) location.href = "/pm/issues"; }
    else flash(false, r.error || "บันทึกไม่สำเร็จ");
  }

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>
      {msg && <div style={{ background: msg.ok ? "#ECFDF5" : "#FEF2F2", color: msg.ok ? "#047857" : "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{msg.text}</div>}
      <div className="card" style={{ padding: 20, display: "grid", gap: 14 }}>
        <F label="หัวข้อปัญหา *"><input className="input" placeholder="Xxxxx" value={title} onChange={(e) => setTitle(e.target.value)} /></F>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <F label="โครงการ (Project) *"><select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}><option value="">— เลือก —</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></F>
          <F label="สถานะ"><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></F>
          <F label="ผู้แจ้ง"><select className="input" value={raisedBy} onChange={(e) => setRaisedBy(e.target.value)}><option value="">— (ฉัน) —</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></F>
          <F label="ผู้รับผิดชอบ"><select className="input" value={actionedBy} onChange={(e) => setActionedBy(e.target.value)}><option value="">— ยังไม่กำหนด —</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></F>
        </div>
        <F label="รายละเอียดปัญหา"><textarea className="input" style={{ height: 120, padding: 12 }} placeholder="Xxxxx" value={description} onChange={(e) => setDescription(e.target.value)} /></F>
        <F label="แผนการแก้ไข (Action Plan)"><textarea className="input" style={{ height: 120, padding: 12 }} placeholder="Xxxxx" value={actionPlan} onChange={(e) => setActionPlan(e.target.value)} /></F>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
        <a href="/pm/issues" className="btn-ghost">← กลับ</a>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => save(false)} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button>
          <button className="btn-primary" onClick={() => save(true)} disabled={saving}>บันทึก & ปิด</button>
        </div>
      </div>
    </div>
  );
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7280" }}>{label}</span>{children}</label>; }
