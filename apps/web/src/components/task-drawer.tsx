"use client";
import { useEffect, useState, useCallback } from "react";
import { apiWrite } from "@/lib/offline";
import { uploadToGoogleDrive } from "@/lib/upload";

const NAVY = "#001D58", PINK = "#EC186E";
type Ref = { id: string | number; label: string };
type Tag = { id: number; name: string; color: string | null };

export function TaskDrawer({ taskId, users, priorities, statuses, features, tags, onClose, onChanged, onNeedsReload }: {
  taskId: number; users: Ref[]; priorities: Ref[]; statuses: Ref[]; features: Ref[]; tags: Tag[];
  onClose: () => void; onChanged: (patch?: any) => void; onNeedsReload?: () => void;
}) {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"detail" | "comments" | "worklog" | "files" | "deps" | "activity">("detail");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/tasks/detail?id=${taskId}`); if (r.ok) setData(await r.json());
  }, [taskId]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <div style={overlay} onClick={onClose}><div style={{ color: "#fff" }}>กำลังโหลด...</div></div>;
  const t = data.task;
  const u2d = (u: number | null) => u ? new Date(u * 1000).toISOString().slice(0, 10) : "";

  // map field ที่แสดงบนการ์ด board → ส่ง patch ให้ board อัปเดตทันที (ไม่ refresh)
  function cardPatch(body: any): any | undefined {
    const p: any = {};
    if ("title" in body) p.title = body.title;
    if ("workflowStatusId" in body) p.workflowStatusId = body.workflowStatusId ? Number(body.workflowStatusId) : null;
    if ("assigneeId" in body) p.assignee = body.assigneeId ? { id: body.assigneeId, name: users.find((u) => String(u.id) === String(body.assigneeId))?.label ?? null } : null;
    if ("priorityId" in body) { const pr = body.priorityId ? priorities.find((x) => String(x.id) === String(body.priorityId)) : null; p.priority = pr ? { name: pr.label, color: null } : null; }
    if ("estimatedHours" in body) p.estimatedHours = body.estimatedHours ? Number(body.estimatedHours) : null;
    return Object.keys(p).length ? p : undefined;
  }

  // optimistic: อัปเดต state ในดรอเวอร์ทันที + แจ้ง board + ยิง API เบื้องหลัง
  async function patch(body: any) {
    setData((d: any) => ({ ...d, task: { ...d.task, ...toSnake(body) } }));
    onChanged(cardPatch(body));
    setSaving(true);
    const r = await apiWrite(`/api/tasks/${taskId}`, "PATCH", body);
    setSaving(false);
    if (!r.ok && !r.queued) setMsg("บันทึกไม่สำเร็จ");
  }
  function toSnake(b: any) {
    const m: Record<string, string> = { workflowStatusId: "workflow_status_id", assigneeId: "assignee_id", priorityId: "priority_id", featureId: "feature_id", sprintId: "sprint_id", estimatedHours: "estimated_hours", budgetCost: "budget_cost", startDate: "start_date", dueDate: "due_date", title: "title", note: "note" };
    const o: any = {}; for (const k in b) o[m[k] ?? k] = b[k]; return o;
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={{ marginLeft: "auto", width: "min(560px,100vw)", height: "100dvh", background: "#fff", overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,.15)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: NAVY, color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ flex: 1 }}>
            <input value={t.title} onChange={(e) => setData({ ...data, task: { ...t, title: e.target.value } })} onBlur={() => patch({ title: t.title })} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 18, fontWeight: 700, width: "100%", outline: "none" }} />
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)", marginTop: 2 }}>Task #{t.id} {saving && "· กำลังบันทึก..."}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "10px 16px 0", borderBottom: "1px solid #F0F1F3", position: "sticky", top: 62, background: "#fff", zIndex: 1, flexWrap: "wrap" }}>
          {([["detail","รายละเอียด"],["comments",`คอมเมนต์ (${data.comments.length})`],["worklog",`ลงเวลา (${data.worklogs.length})`],["files",`ไฟล์ (${data.attachments.length})`],["deps","Dependencies"],["activity","ประวัติ"]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)} style={{ padding: "8px 12px", border: "none", background: "transparent", borderBottom: tab === k ? `2px solid ${PINK}` : "2px solid transparent", color: tab === k ? NAVY : "#9AA0A6", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: 20 }}>
          {msg && <div style={{ background: "#EFF6FF", color: "#1D4ED8", padding: 8, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{msg}</div>}

          {tab === "detail" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Row label="สถานะ"><select className="input" value={t.workflow_status_id ?? ""} onChange={(e) => patch({ workflowStatusId: e.target.value || null })}><option value="">—</option>{statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Row>
              <Row label="ผู้รับผิดชอบ"><select className="input" value={t.assignee_id ?? ""} onChange={(e) => patch({ assigneeId: e.target.value || null })}><option value="">— ไม่มี —</option>{users.map((u) => <option key={String(u.id)} value={String(u.id)}>{u.label}</option>)}</select></Row>
              <Row label="Priority"><select className="input" value={t.priority_id ?? ""} onChange={(e) => patch({ priorityId: e.target.value || null })}><option value="">—</option>{priorities.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></Row>
              <Row label="Feature"><select className="input" value={t.feature_id ?? ""} onChange={(e) => patch({ featureId: e.target.value || null })}><option value="">—</option>{features.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select></Row>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Row label="วันเริ่ม"><input className="input" type="date" defaultValue={u2d(t.start_date)} onBlur={(e) => patch({ startDate: e.target.value || null })} /></Row>
                <Row label="กำหนดส่ง"><input className="input" type="date" defaultValue={u2d(t.due_date)} onBlur={(e) => patch({ dueDate: e.target.value || null })} /></Row>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Row label="ชม.ประเมิน"><input className="input" type="number" defaultValue={t.estimated_hours ?? ""} onBlur={(e) => patch({ estimatedHours: e.target.value || null })} /></Row>
                <Row label="งบประมาณ"><input className="input" type="number" defaultValue={t.budget_cost ?? ""} onBlur={(e) => patch({ budgetCost: e.target.value || null })} /></Row>
              </div>
              <Row label="โน้ต"><textarea className="input" style={{ height: 80, padding: 10 }} defaultValue={t.note ?? ""} onBlur={(e) => patch({ note: e.target.value || null })} /></Row>
              <Row label="Tags">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {tags.map((tg) => {
                    const on = data.tags.some((x: Tag) => x.id === tg.id);
                    return <button key={tg.id} onClick={async () => { await apiWrite("/api/tags/toggle", "POST", { taskId, tagId: tg.id, action: on ? "remove" : "add" }); load(); }} style={{ padding: "4px 12px", borderRadius: 20, border: on ? "none" : "1px solid #E5E7EB", background: on ? (tg.color || NAVY) : "#fff", color: on ? "#fff" : "#6B7280", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{on ? "✓ " : "+ "}{tg.name}</button>;
                  })}
                </div>
              </Row>
              <CustomFields taskId={taskId} />
              <button onClick={async () => { if (confirm("ลบงานนี้?")) { await apiWrite(`/api/tasks/${taskId}`, "DELETE", {}); onNeedsReload?.(); onClose(); } }} style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 8, border: "1px solid #FCA5A5", background: "#fff", color: "#DC2626", cursor: "pointer", fontWeight: 600 }}>ลบงานนี้</button>
            </div>
          )}

          {tab === "comments" && <CommentTab taskId={taskId} comments={data.comments} onPost={() => { load(); }} />}
          {tab === "worklog" && <WorklogTab taskId={taskId} worklogs={data.worklogs} onPost={() => { load(); }} />}
          {tab === "files" && <FileTab taskId={taskId} attachments={data.attachments} onChange={() => { load(); onChanged(); }} setMsg={setMsg} />}
          {tab === "deps" && <DepsTab taskId={taskId} />}
          {tab === "activity" && <ActivityTab activity={data.activity} />}
        </div>
      </div>
    </div>
  );
}

function CommentTab({ taskId, comments, onPost }: { taskId: number; comments: any[]; onPost: () => void }) {
  const [text, setText] = useState("");
  async function post() { if (!text.trim()) return; await apiWrite("/api/comments", "POST", { referenceType: "task", referenceId: taskId, content: text }); setText(""); onPost(); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}><input className="input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} placeholder="เขียนคอมเมนต์..." /><button className="btn-pink" onClick={post}>ส่ง</button></div>
      {comments.length === 0 && <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มีคอมเมนต์</div>}
      {comments.map((c) => (
        <div key={c.id} style={{ borderLeft: `3px solid ${PINK}`, paddingLeft: 12 }}>
          <div style={{ fontSize: 13 }}>{c.content}</div>
          <div style={{ fontSize: 11, color: "#9AA0A6" }}>{c.author ?? "—"} · {new Date(c.created_at * 1000).toLocaleString("th-TH")}</div>
        </div>
      ))}
    </div>
  );
}
function WorklogTab({ taskId, worklogs, onPost }: { taskId: number; worklogs: any[]; onPost: () => void }) {
  const [hours, setHours] = useState(""); const [note, setNote] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  async function post() { if (!hours) return; await apiWrite("/api/worklogs/create", "POST", { taskId, hours: Number(hours), note, date }); setHours(""); setNote(""); onPost(); }
  const total = worklogs.reduce((s, w) => s + (Number(w.hours_spent) || 0), 0);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input className="input" style={{ width: 90 }} type="number" placeholder="ชม." value={hours} onChange={(e) => setHours(e.target.value)} />
        <input className="input" style={{ width: 140 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="โน้ต" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-pink" onClick={post}>ลง</button>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>รวม {total} ชม.</div>
      {worklogs.map((w) => <div key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: "1px solid #F0F1F3", padding: "6px 0" }}><span>{w.author ?? "—"} · {w.note || "-"}</span><span style={{ fontWeight: 600 }}>{w.hours_spent} ชม.</span></div>)}
    </div>
  );
}
function FileTab({ taskId, attachments, onChange, setMsg }: { taskId: number; attachments: any[]; onChange: () => void; setMsg: (s: string) => void }) {
  const [up, setUp] = useState(false);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUp(true); const r = await uploadToGoogleDrive(file); setUp(false);
    if (r.ok && r.url) { await apiWrite("/api/attachments", "POST", { referenceType: "task", referenceId: taskId, fileName: file.name, gdriveFileId: r.fileId, gdriveWebLink: r.url, fileType: "Doc" }); setMsg("แนบไฟล์แล้ว"); onChange(); }
    else setMsg(r.error || "อัปโหลดไม่สำเร็จ");
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <label className="btn-ghost" style={{ alignSelf: "flex-start", cursor: "pointer" }}>{up ? "กำลังอัปโหลด..." : "📎 แนบไฟล์"}<input type="file" hidden onChange={onFile} /></label>
      {attachments.length === 0 && <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มีไฟล์</div>}
      {attachments.map((a) => (
        <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0F1F3", padding: "8px 0" }}>
          <a href={a.gdrive_web_link} target="_blank" style={{ color: "#1D4ED8", fontSize: 13.5 }}>📄 {a.file_name || "ไฟล์"}</a>
          <button onClick={async () => { await apiWrite(`/api/attachments?id=${a.id}`, "DELETE", {}); onChange(); }} style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer" }}>✕</button>
        </div>
      ))}
    </div>
  );
}
function CustomFields({ taskId }: { taskId: number }) {
  const [defs, setDefs] = useState<any[]>([]); const [vals, setVals] = useState<Record<number, any>>({});
  async function load() {
    const r = await fetch(`/api/custom-fields?ref=task&refId=${taskId}`);
    if (r.ok) { const d = await r.json(); setDefs(d.defs); const m: Record<number, any> = {}; for (const v of d.values) m[v.custom_field_id] = v.value_string ?? v.value_number ?? (v.value_date ? new Date(v.value_date * 1000).toISOString().slice(0, 10) : ""); setVals(m); }
  }
  useEffect(() => { load(); }, []);
  async function save(id: number, value: any) { await apiWrite("/api/custom-fields/value", "POST", { customFieldId: id, referenceId: taskId, value }); }
  if (defs.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #F0F1F3", paddingTop: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: NAVY }}>Custom Fields</div>
      {defs.map((d) => (
        <Row key={d.id} label={d.name}>
          {d.field_type === "Dropdown" ? <select className="input" defaultValue={vals[d.id] ?? ""} onChange={(e) => save(d.id, e.target.value)}><option value="">—</option>{(d.options || "").split(",").map((o: string) => <option key={o} value={o.trim()}>{o.trim()}</option>)}</select>
            : d.field_type === "Checkbox" ? <input type="checkbox" defaultChecked={vals[d.id] === "true"} onChange={(e) => save(d.id, e.target.checked ? "true" : "false")} style={{ width: 18, height: 18 }} />
            : <input className="input" type={d.field_type === "Number" ? "number" : d.field_type === "Date" ? "date" : "text"} defaultValue={vals[d.id] ?? ""} onBlur={(e) => save(d.id, e.target.value)} />}
        </Row>
      ))}
    </div>
  );
}
function DepsTab({ taskId }: { taskId: number }) {
  const [deps, setDeps] = useState<any[]>([]); const [cands, setCands] = useState<any[]>([]);
  const [sel, setSel] = useState(""); const [type, setType] = useState("FS");
  async function load() { const r = await fetch(`/api/tasks/deps?taskId=${taskId}`); if (r.ok) { const d = await r.json(); setDeps(d.deps); setCands(d.candidates); } }
  useEffect(() => { load(); }, []);
  async function add() { if (!sel) return; await apiWrite("/api/tasks/deps", "POST", { successorTaskId: taskId, predecessorTaskId: Number(sel), dependencyType: type }); setSel(""); load(); }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 12.5, color: "#6B7280" }}>งานนี้จะเริ่มได้เมื่องานก่อนหน้า (predecessor) เสร็จ — ประเภท: FS/SS/FF/SF</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select className="input" style={{ flex: 1, minWidth: 140 }} value={sel} onChange={(e) => setSel(e.target.value)}><option value="">— เลือกงานก่อนหน้า —</option>{cands.map((c) => <option key={c.id} value={c.id}>#{c.id} {c.title}</option>)}</select>
        <select className="input" style={{ width: 80 }} value={type} onChange={(e) => setType(e.target.value)}>{["FS","SS","FF","SF"].map((t) => <option key={t}>{t}</option>)}</select>
        <button className="btn-pink" onClick={add}>+ เพิ่ม</button>
      </div>
      {deps.length === 0 && <div style={{ color: "#9AA0A6", fontSize: 13 }}>ยังไม่มี dependency</div>}
      {deps.map((d) => (
        <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #F0F1F3", padding: "8px 0" }}>
          <span style={{ fontSize: 13 }}><span className="badge" style={{ background: "#EEF2FF", color: "#4338CA", marginRight: 6 }}>{d.dependency_type}</span>#{d.predecessor_task_id} {d.predecessor_title}</span>
          <button onClick={async () => { await apiWrite(`/api/tasks/deps?id=${d.id}`, "DELETE", {}); load(); }} style={{ border: "none", background: "transparent", color: "#DC2626", cursor: "pointer" }}>✕</button>
        </div>
      ))}
    </div>
  );
}
function ActivityTab({ activity }: { activity: any[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {activity.length === 0 && <div style={{ color: "#9AA0A6", fontSize: 13 }}>ไม่มีประวัติ</div>}
      {activity.map((a) => (
        <div key={a.id} style={{ fontSize: 12.5, display: "flex", gap: 8 }}>
          <span style={{ color: PINK }}>●</span>
          <div><b>{a.actor ?? "—"}</b> {a.action}{a.new_value ? ` → ${a.new_value}` : ""}<div style={{ color: "#9AA0A6", fontSize: 11 }}>{new Date(a.created_at * 1000).toLocaleString("th-TH")}</div></div>
        </div>
      ))}
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 12.5, fontWeight: 600, color: "#6B7280" }}>{label}</span>{children}</label>;
}
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", zIndex: 55 };
