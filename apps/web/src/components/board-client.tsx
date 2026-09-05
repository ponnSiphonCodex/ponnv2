"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BoardData } from "@/lib/board-data";
import { apiWrite } from "@/lib/offline";
import { TaskDrawer } from "./task-drawer";

const NAVY = "#001D58", PINK = "#EC186E";
type Ref = { id: string | number; label: string };
type Tag = { id: number; name: string; color: string | null };

export function BoardClient({ board, projects, users, priorities, features, tags, canWrite }: {
  board: BoardData; projects: { id: number; name: string }[]; users: Ref[]; priorities: Ref[]; features: Ref[]; tags: Tag[]; canWrite: boolean;
}) {
  const router = useRouter();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [addTo, setAddTo] = useState<number | null>(null);
  const [drawerTask, setDrawerTask] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const statusRefs: Ref[] = board.columns.map((c) => ({ id: c.id, label: c.name }));

  async function drop(colId: number) {
    if (dragId == null) return;
    const col = board.columns.find((c) => c.id === colId);
    const order = col ? [...col.tasks.map((t) => t.id).filter((id) => id !== dragId), dragId] : undefined;
    setBusy(true);
    const r = await apiWrite("/api/tasks/move", "POST", { taskId: dragId, statusId: colId, order });
    setBusy(false); setDragId(null); setOverCol(null);
    if (r.queued) setFlash(r.error!);
    router.refresh();
  }

  return (
    <div style={{ padding: 20 }}>
      {flash && <div style={{ background: "#EFF6FF", color: "#1D4ED8", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{flash}</div>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select className="input" style={{ width: "auto", minWidth: 220 }} value={board.project.id} onChange={(e) => router.push(`/pm/board?id=${e.target.value}`)}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 160, height: 8, background: "#E5E7EB", borderRadius: 5, overflow: "hidden" }}><div style={{ width: `${board.project.progress.percent}%`, height: "100%", background: PINK }} /></div>
          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{board.project.progress.percent}%</span>
          <span style={{ fontSize: 12.5, color: "#6B7280" }}>({board.project.progress.done}/{board.project.progress.total - board.project.progress.drop} เสร็จ · Drop {board.project.progress.drop})</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, opacity: busy ? 0.6 : 1 }}>
        {board.columns.map((col) => (
          <div key={col.id}
            onDragOver={(e) => { if (canWrite) { e.preventDefault(); setOverCol(col.id); } }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={() => canWrite && drop(col.id)}
            style={{ minWidth: 270, width: 270, background: overCol === col.id ? "#FFF5F9" : "#fff", border: overCol === col.id ? `1.5px dashed ${PINK}` : "1px solid #E5E7EB", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 210px)", transition: "background .1s" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #F0F1F3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: NAVY }}><span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: col.color || "#9AA0A6", marginRight: 7 }} />{col.name} <span style={{ color: "#9AA0A6", fontWeight: 500 }}>({col.tasks.length})</span></span>
              {canWrite && <button onClick={() => setAddTo(col.id)} title="เพิ่มงาน" style={{ border: "none", background: "transparent", color: PINK, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>+</button>}
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 9, overflowY: "auto", minHeight: 60 }}>
              {col.tasks.length === 0 && <div style={{ color: "#C7CCD4", fontSize: 13, textAlign: "center", padding: "14px 0" }}>ว่าง</div>}
              {col.tasks.map((t) => (
                <div key={t.id} draggable={canWrite} onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }} onClick={() => setDrawerTask(t.id)}
                  style={{ border: dragId === t.id ? `1.5px solid ${PINK}` : "1px solid #ECEEF1", borderRadius: 10, padding: 11, cursor: canWrite ? "grab" : "default", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.03)", opacity: dragId === t.id ? 0.5 : 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{t.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.assignee?.name ?? "ยังไม่มอบหมาย"}</span>
                    {t.priority && <span className="badge" style={{ color: "#fff", background: t.priority.color || "#6B7280" }}>{t.priority.name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 5 }}>⏱ {t.actualHours}/{t.estimatedHours ?? 0} ชม.</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {addTo != null && <AddTaskModal projectId={board.project.id} statusId={addTo} users={users} priorities={priorities} onClose={() => setAddTo(null)} onSaved={(q) => { setAddTo(null); if (q) setFlash(q); router.refresh(); }} />}
      {drawerTask != null && <TaskDrawer taskId={drawerTask} users={users} priorities={priorities} statuses={statusRefs} features={features} tags={tags} onClose={() => setDrawerTask(null)} onChanged={() => router.refresh()} />}
    </div>
  );
}

function AddTaskModal({ projectId, statusId, users, priorities, onClose, onSaved }: { projectId: number; statusId: number; users: Ref[]; priorities: Ref[]; onClose: () => void; onSaved: (q?: string) => void }) {
  const [title, setTitle] = useState(""); const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState(""); const [est, setEst] = useState("");
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!title.trim()) { setErr("กรุณากรอกชื่องาน"); return; }
    setSaving(true); setErr(null);
    const r = await apiWrite("/api/tasks/create", "POST", { title, projectId, statusId, assigneeId: assignee || null, priorityId: priority ? Number(priority) : null, estimatedHours: est ? Number(est) : null });
    setSaving(false);
    if (r.ok) { onSaved(); return; } if (r.queued) { onSaved(r.error!); return; } setErr(r.error || "บันทึกไม่สำเร็จ");
  }
  return <Modal title="เพิ่มงาน" onClose={onClose} err={err}>
    <F label="ชื่องาน *"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></F>
    <F label="ผู้รับผิดชอบ"><select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">— เลือก —</option>{users.map((u) => <option key={String(u.id)} value={String(u.id)}>{u.label}</option>)}</select></F>
    <F label="Priority"><select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">— เลือก —</option>{priorities.map((p) => <option key={String(p.id)} value={String(p.id)}>{p.label}</option>)}</select></F>
    <F label="ชั่วโมงประเมิน"><input className="input" type="number" value={est} onChange={(e) => setEst(e.target.value)} /></F>
    <A onClose={onClose} onSave={submit} saving={saving} />
  </Modal>;
}
function WorklogModal({ task, onClose, onSaved }: { task: { id: number; title: string }; onClose: () => void; onSaved: (q?: string) => void }) {
  const [hours, setHours] = useState(""); const [note, setNote] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!hours) { setErr("กรุณากรอกชั่วโมง"); return; }
    setSaving(true); setErr(null);
    const r = await apiWrite("/api/worklogs/create", "POST", { taskId: task.id, hours: Number(hours), note, date });
    setSaving(false);
    if (r.ok) { onSaved(); return; } if (r.queued) { onSaved(r.error!); return; } setErr(r.error || "บันทึกไม่สำเร็จ");
  }
  return <Modal title={`ลงเวลา: ${task.title}`} onClose={onClose} err={err}>
    <F label="ชั่วโมงที่ทำ *"><input className="input" type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></F>
    <F label="วันที่"><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></F>
    <F label="โน้ต"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></F>
    <A onClose={onClose} onSave={submit} saving={saving} />
  </Modal>;
}
function Modal({ title, children, onClose, err }: { title: string; children: React.ReactNode; onClose: () => void; err: string | null }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}><div className="card" style={{ width: "min(460px,94vw)", padding: 22 }} onClick={(e) => e.stopPropagation()}><h3 style={{ marginTop: 0, color: NAVY }}>{title}</h3>{err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div></div></div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
function A({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) { return <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={onSave} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึก"}</button></div>; }
