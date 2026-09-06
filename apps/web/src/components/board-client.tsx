"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BoardData, BoardColumn, BoardTask } from "@/lib/board-data";
import { apiWrite } from "@/lib/offline";
import { TaskDrawer } from "./task-drawer";

const NAVY = "#001D58", PINK = "#EC186E";
type Ref = { id: string | number; label: string };
type Tag = { id: number; name: string; color: string | null };

export function BoardClient({ board, projects, users, priorities, features, tags, canWrite, aggregate = false }: {
  board: BoardData; projects: { id: number; name: string }[]; users: Ref[]; priorities: Ref[]; features: Ref[]; tags: Tag[]; canWrite: boolean; aggregate?: boolean;
}) {
  const router = useRouter();
  // ★ columns เป็น local state → drag/add แก้ทันที ไม่รอ server
  const [columns, setColumns] = useState<BoardColumn[]>(board.columns);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);
  const [addTo, setAddTo] = useState<number | null>(null);
  const [drawerTask, setDrawerTask] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const seq = useRef(-1);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [touchMoveId, setTouchMoveId] = useState<number | null>(null); // id ชั่วคราวสำหรับการ์ดใหม่ (ก่อน server ตอบ)
  const statusRefs: Ref[] = columns.map((c) => ({ id: c.id, label: c.name }));

  // progress คำนวณสดจาก state
  const allTasks = columns.flatMap((c) => c.tasks);
  const catById = new Map(columns.map((c) => [c.id, c.category]));
  const doneCount = allTasks.filter((t) => catById.get(t.workflowStatusId ?? -1) === "done").length;
  const dropCount = allTasks.filter((t) => catById.get(t.workflowStatusId ?? -1) === "drop").length;
  const total = allTasks.length; const denom = total - dropCount;
  const percent = denom <= 0 ? 0 : Math.round((doneCount / denom) * 1000) / 10;

  function optimisticMove(taskId: number, toCol: number) {
    setColumns((cols) => {
      let moved: BoardTask | null = null;
      const stripped = cols.map((c) => ({ ...c, tasks: c.tasks.filter((t) => { if (t.id === taskId) { moved = t; return false; } return true; }) }));
      if (!moved) return cols;
      return stripped.map((c) => c.id === toCol ? { ...c, tasks: [...c.tasks, { ...moved!, workflowStatusId: toCol }] } : c);
    });
  }

  async function dropTo(colId: number) {
    const movingId = dragId ?? touchMoveId;
    if (movingId == null) return;
    const id = movingId;
    setDragId(null); setTouchMoveId(null); setOverCol(null);
    optimisticMove(id, colId); // แก้ทันที
    const order = (columns.find((c) => c.id === colId)?.tasks.map((t) => t.id).filter((x) => x !== id) ?? []).concat(id);
    const r = await apiWrite("/api/tasks/move", "POST", { taskId: id, statusId: colId, order }); // ยิงเบื้องหลัง
    if (!r.ok && !r.queued) { setFlash("บันทึกไม่สำเร็จ กำลังโหลดใหม่..."); router.refresh(); }
    else if (r.queued) setFlash(r.error!);
  }

  function addTaskLocal(t: BoardTask, colId: number) {
    setColumns((cols) => cols.map((c) => c.id === colId ? { ...c, tasks: [...c.tasks, t] } : c));
  }

  return (
    <div style={{ padding: 20 }}>
      {flash && <div style={{ background: "#EFF6FF", color: "#1D4ED8", padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{flash}</div>}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select className="input" style={{ width: "auto", minWidth: 220 }} value={aggregate ? "all" : board.project.id} onChange={(e) => router.push(`/pm/board?id=${e.target.value}`)}>
          <option value="all">📊 ทุกโครงการ (รวม)</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 160, height: 8, background: "#E5E7EB", borderRadius: 5, overflow: "hidden" }}><div style={{ width: `${percent}%`, height: "100%", background: PINK, transition: "width .2s" }} /></div>
          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{percent}%</span>
          <span style={{ fontSize: 12.5, color: "#6B7280" }}>({doneCount}/{total - dropCount} เสร็จ · Drop {dropCount})</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {columns.map((col) => (
          <div key={col.id}
            onDragOver={(e) => { if (canWrite) { e.preventDefault(); setOverCol(col.id); } }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={() => canWrite && dropTo(col.id)}
            onClick={(e) => { if (canWrite && touchMoveId != null && (e.target as HTMLElement).closest(".kanban-card") == null) dropTo(col.id); }}
            style={{ minWidth: 272, width: 272, background: overCol === col.id ? "#FFF5F9" : "#fff", border: overCol === col.id ? `1.5px dashed ${PINK}` : "1px solid #E5E7EB", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 250px)", transition: "background .1s", overflow: "hidden" }}>
            {/* v27: หัว column สีเต็มแถบตาม category — แยกด้วยสีชัดเจน อ่านง่าย */}
            <div style={{ padding: "10px 14px", background: col.color || "#9AA0A6", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 11, borderTopRightRadius: 11 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>{col.name}<span style={{ background: "rgba(255,255,255,.28)", color: "#fff", fontSize: 11.5, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{col.tasks.length}</span></span>
              {canWrite && <button onClick={() => setAddTo(col.id)} title="เพิ่มงาน" style={{ border: "none", background: "rgba(255,255,255,.25)", color: "#fff", width: 24, height: 24, borderRadius: 6, fontSize: 17, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>}
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 9, overflowY: "auto", minHeight: 60 }}>
              {col.tasks.length === 0 && <div style={{ color: "#C7CCD4", fontSize: 13, textAlign: "center", padding: "14px 0" }}>ว่าง</div>}
              {col.tasks.map((t) => (
                <div key={t.id} className={`kanban-card ${touchMoveId === t.id ? "touch-armed" : ""}`} draggable={canWrite} onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }}
                  onPointerDown={(e) => { if (!canWrite || e.pointerType === "mouse") return; longPressTimer.current = setTimeout(() => { setTouchMoveId(t.id); setFlash("เลือกงานแล้ว แตะพื้นที่ว่างในคอลัมน์ปลายทางเพื่อย้าย"); navigator.vibrate?.(35); }, 450); }}
                  onPointerUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }} onPointerCancel={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }} onPointerMove={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                  onClick={(e) => { if (touchMoveId === t.id) { e.stopPropagation(); return; } if (touchMoveId != null) { e.stopPropagation(); return; } if (t.id > 0) setDrawerTask(t.id); }}
                  style={{ border: dragId === t.id ? `1.5px solid ${PINK}` : "1px solid #ECEEF1", borderLeft: `3px solid ${col.color || "#ECEEF1"}`, borderRadius: 10, padding: 11, cursor: aggregate ? "pointer" : (canWrite ? "grab" : "default"), background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.03)", opacity: dragId === t.id ? 0.5 : (t.id < 0 ? 0.6 : 1) }}>
                  {aggregate && (t as any).projectName && <div style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, background: "#EEF1F6", display: "inline-block", padding: "1px 7px", borderRadius: 5, marginBottom: 5 }}>{(t as any).projectName}</div>}
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{t.title}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.assignee?.name ?? "ยังไม่มอบหมาย"}</span>
                    {t.priority && <span className="badge" style={{ color: "#fff", background: t.priority.color || "#6B7280" }}>{t.priority.name}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 5 }}>{t.actualHours}/{t.estimatedHours ?? 0} ชม.</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {addTo != null && <AddTaskModal projectId={board.project.id} statusId={addTo} users={users} priorities={priorities}
        onClose={() => setAddTo(null)}
        onOptimistic={(title, assigneeId, priorityId, est) => {
          const tempId = seq.current--;
          const assignee = assigneeId ? { id: assigneeId, name: users.find((u) => String(u.id) === assigneeId)?.label ?? null } : null;
          const pr = priorityId ? priorities.find((p) => String(p.id) === String(priorityId)) : null;
          addTaskLocal({ id: tempId, title, workflowStatusId: addTo, sortOrder: 999, assignee, priority: pr ? { name: pr.label, color: null } : null, estimatedHours: est, actualHours: 0, dueDate: null }, addTo);
        }}
        onSaved={(q) => { setAddTo(null); if (q) setFlash(q); router.refresh(); }} />}

      {drawerTask != null && <TaskDrawer taskId={drawerTask} users={users} priorities={priorities} statuses={statusRefs} features={features} tags={tags}
        onClose={() => setDrawerTask(null)}
        onChanged={(patch) => {
          // อัปเดตเฉพาะการ์ดนั้นใน state (ไม่ refresh ทั้งหน้า)
          if (patch) setColumns((cols) => cols.map((c) => ({ ...c, tasks: c.tasks.map((t) => t.id === drawerTask ? { ...t, ...patch } : t) })));
        }}
        onNeedsReload={() => router.refresh()} />}
    </div>
  );
}

function AddTaskModal({ projectId, statusId, users, priorities, onClose, onOptimistic, onSaved }: { projectId: number; statusId: number; users: Ref[]; priorities: Ref[]; onClose: () => void; onOptimistic: (title: string, assigneeId: string, priorityId: string, est: number | null) => void; onSaved: (q?: string) => void }) {
  const [title, setTitle] = useState(""); const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState(""); const [est, setEst] = useState("");
  const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!title.trim()) { setErr("กรุณากรอกชื่องาน"); return; }
    onOptimistic(title, assignee, priority, est ? Number(est) : null); // การ์ดโผล่ทันที
    onClose();
    const r = await apiWrite("/api/tasks/create", "POST", { title, projectId, statusId, assigneeId: assignee || null, priorityId: priority ? Number(priority) : null, estimatedHours: est ? Number(est) : null });
    onSaved(r.queued ? r.error! : undefined); // sync จริงเบื้องหลัง
  }
  return <Modal title="เพิ่มงาน" onClose={onClose} err={err}>
    <F label="ชื่องาน *"><input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></F>
    <F label="ผู้รับผิดชอบ"><select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">— เลือก —</option>{users.map((u) => <option key={String(u.id)} value={String(u.id)}>{u.label}</option>)}</select></F>
    <F label="Priority"><select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">— เลือก —</option>{priorities.map((p) => <option key={String(p.id)} value={String(p.id)}>{p.label}</option>)}</select></F>
    <F label="ชั่วโมงประเมิน"><input className="input" type="number" value={est} onChange={(e) => setEst(e.target.value)} /></F>
    <A onClose={onClose} onSave={submit} saving={false} />
  </Modal>;
}
function Modal({ title, children, onClose, err }: { title: string; children: React.ReactNode; onClose: () => void; err: string | null }) {
  return <div className="motion-overlay" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}><div className="card motion-modal" style={{ width: "min(460px,94vw)", padding: 22 }} onClick={(e) => e.stopPropagation()}><h3 style={{ marginTop: 0, color: NAVY }}>{title}</h3>{err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div></div></div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
function A({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) { return <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={onSave} disabled={saving}>บันทึก</button></div>; }
