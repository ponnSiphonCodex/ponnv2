"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { BoardData, BoardColumn, BoardTask } from "@/lib/board-data";
import { apiWrite } from "@/lib/offline";
import { TaskDrawer } from "./task-drawer";
import { MultiSelect } from "./multi-select";

const NAVY = "#001D58", PINK = "#EC186E";
type Ref = { id: string | number; label: string };
type Tag = { id: number; name: string; color: string | null };

export function BoardClient({ board, projects, users, priorities, features, tags, canWrite, aggregate = false, isAdmin = false }: {
  board: BoardData; projects: { id: number; name: string }[]; users: Ref[]; priorities: Ref[]; features: Ref[]; tags: Tag[]; canWrite: boolean; aggregate?: boolean; isAdmin?: boolean;
}) {
  const router = useRouter();
  // ★ columns เป็น local state → drag/add แก้ทันที ไม่รอ server
  const [columns, setColumns] = useState<BoardColumn[]>(board.columns);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);
  const [addTo, setAddTo] = useState<number | null>(null);
  const [drawerTask, setDrawerTask] = useState<number | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showCardSettings,setShowCardSettings]=useState(false);
  const ALL_CARD_FIELDS=[["note","รายละเอียด Task"],["project","Project"],["product","Product"],["feature","Feature"],["status","Status"],["assignee","ผู้รับผิดชอบ"],["priority","Priority"],["start","Start Date"],["due","Due Date"],["hours","Actual / Estimate Hours"],["budget","Budget Cost"],["created","Created Date"],["updated","Updated Date"]] as const;
  const [cardFields,setCardFields]=useState<string[]>(ALL_CARD_FIELDS.map(x=>x[0]));
  useEffect(()=>{try{const v=localStorage.getItem("kanban-card-fields");if(v)setCardFields(JSON.parse(v))}catch{}},[]);
  const saveFields=(n:string[])=>{setCardFields(n);localStorage.setItem("kanban-card-fields",JSON.stringify(n))}; const toggleField=(f:string)=>saveFields(cardFields.includes(f)?cardFields.filter(x=>x!==f):[...cardFields,f]); const moveField=(key:string,d:number)=>{const i=cardFields.indexOf(key),j=i+d;if(i<0||j<0||j>=cardFields.length)return;const n=[...cardFields];[n[i],n[j]]=[n[j],n[i]];saveFields(n)}; const orderedSettings=[...cardFields.map(k=>ALL_CARD_FIELDS.find(x=>x[0]===k)!).filter(Boolean),...ALL_CARD_FIELDS.filter(x=>!cardFields.includes(x[0]))];
  const [projectIds,setProjectIds]=useState<(number|string)[]>([]); const [productIds,setProductIds]=useState<(number|string)[]>([]); const [featureIds,setFeatureIds]=useState<(number|string)[]>([]);
  const seq = useRef(-1); // id ชั่วคราวสำหรับการ์ดใหม่ (ก่อน server ตอบ)
  const statusRefs: Ref[] = columns.map((c) => ({ id: c.id, label: c.name }));

  // progress คำนวณสดจาก state
  const matches=(t:BoardTask)=>(!projectIds.length||projectIds.map(String).includes(String(t.projectId)))&&(!productIds.length||productIds.map(String).includes(String(t.productId)))&&(!featureIds.length||featureIds.map(String).includes(String(t.featureId)));
  const allTasks = columns.flatMap((c) => c.tasks).filter(matches);
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
    if (dragId == null) return;
    const id = dragId;
    setDragId(null); setOverCol(null);
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
      {isAdmin && <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button className="btn-ghost" onClick={()=>setShowCardSettings(true)}>⚙ ตั้งค่า Card</button></div>}

      {aggregate && <div className="gantt-filters" style={{marginBottom:14}}>
        <div><span className="field-hint">Product</span><MultiSelect placeholder="ทุก Product" options={Array.from(new Map(columns.flatMap(c=>c.tasks).filter(t=>t.productId).map(t=>[String(t.productId),{id:t.productId!,name:t.productName??`Product #${t.productId}`}])).values())} value={productIds} onChange={setProductIds}/></div>
        <div><span className="field-hint">Project</span><MultiSelect placeholder="ทุก Project" options={projects} value={projectIds} onChange={setProjectIds}/></div>
        <div><span className="field-hint">Feature</span><MultiSelect placeholder="ทุก Feature" options={Array.from(new Map(columns.flatMap(c=>c.tasks).filter(t=>t.featureId).map(t=>[String(t.featureId),{id:t.featureId!,name:t.featureName??`Feature #${t.featureId}`}])).values())} value={featureIds} onChange={setFeatureIds}/></div>
      </div>}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {columns.map((col) => { const overWip = col.category === "doing" && col.tasks.length > 5; return (
          <div key={col.id}
            onDragOver={(e) => { if (canWrite) { e.preventDefault(); setOverCol(col.id); } }}
            onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
            onDrop={() => canWrite && dropTo(col.id)}
            style={{ minWidth: 272, width: 272, background: overCol === col.id ? "#FFF5F9" : "#fff", border: overCol === col.id ? `1.5px dashed ${PINK}` : "1px solid #E5E7EB", borderRadius: 12, display: "flex", flexDirection: "column", maxHeight: "calc(100dvh - 250px)", transition: "background .1s", overflow: "hidden" }}>
            {/* v27: หัว column สีเต็มแถบตาม category — แยกด้วยสีชัดเจน อ่านง่าย */}
            <div style={{ padding: "10px 14px", background: overWip ? "#DC2626" : (col.color || "#9AA0A6"), display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: 11, borderTopRightRadius: 11 }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: "#fff", display: "flex", alignItems: "center", gap: 7 }}>{col.name}<span style={{ background: "rgba(255,255,255,.28)", color: "#fff", fontSize: 11.5, fontWeight: 700, minWidth: 20, height: 20, borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{col.tasks.length}</span></span>
              {canWrite && <button onClick={() => setAddTo(col.id)} title="เพิ่มงาน" style={{ border: "none", background: "rgba(255,255,255,.25)", color: "#fff", width: 24, height: 24, borderRadius: 6, fontSize: 17, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>}
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 9, overflowY: "auto", minHeight: 60 }}>
              {col.tasks.length === 0 && <div style={{ color: "#C7CCD4", fontSize: 13, textAlign: "center", padding: "14px 0" }}>ว่าง</div>}
              {col.tasks.filter(matches).map((t) => (
                <div key={t.id} draggable={canWrite} onDragStart={() => setDragId(t.id)} onDragEnd={() => { setDragId(null); setOverCol(null); }} onClick={() => t.id > 0 && setDrawerTask(t.id)}
                  style={{ border: dragId === t.id ? `1.5px solid ${PINK}` : "1px solid #ECEEF1", borderRadius: 10, padding: 11, cursor: aggregate ? "pointer" : (canWrite ? "grab" : "default"), background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.03)", opacity: dragId === t.id ? 0.5 : (t.id < 0 ? 0.6 : 1) }}>
                  {cardFields.includes("project") && aggregate && (t as any).projectName && <div style={{ fontSize: 10.5, fontWeight: 700, color: NAVY, background: "#EEF1F6", display: "inline-block", padding: "1px 7px", borderRadius: 5, marginBottom: 5 }}>{(t as any).projectName}</div>}
                  <div style={{fontSize:10.5,color:"#9AA0A6",marginBottom:3}}>TASK-{String(t.id).padStart(5,"0")}</div><div style={{ fontSize: 13.5, fontWeight: 600, color: "#1F2937", marginBottom: 6 }}>{t.title}</div>{cardFields.map(f=>{const v=f==="note"?t.note:f==="product"?t.productName:f==="feature"?t.featureName:f==="status"?col.name:f==="start"&&t.startDate?new Date(t.startDate*1000).toISOString().slice(0,10):f==="due"&&t.dueDate?new Date(t.dueDate*1000).toISOString().slice(0,10):f==="budget"&&t.budgetCost!=null?String(t.budgetCost):f==="created"&&t.createdAt?new Date(t.createdAt*1000).toISOString().slice(0,10):f==="updated"&&t.updatedAt?new Date(t.updatedAt*1000).toISOString().slice(0,10):null;return v?<CardValue key={f} value={String(v)} strong={f==="note"}/>:null})}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    {cardFields.includes("assignee")&&<span style={{ fontSize: 11.5, color: "#6B7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.assignee?.name ?? "ยังไม่มอบหมาย"}</span>}
                    {cardFields.includes("priority")&&t.priority && <span className="badge" style={{ color: "#fff", background: t.priority.color || "#6B7280" }}>{t.priority.name}</span>}
                  </div>
                  {cardFields.includes("hours")&&<div style={{ fontSize: 11, color: "#9AA0A6", marginTop: 5 }}>{t.actualHours}/{t.estimatedHours ?? 0} ชม.</div>}
                </div>
              ))}
            </div>
          </div>
        ); })}
      </div>

      {showCardSettings&&<div style={{position:"fixed",inset:0,zIndex:95,background:"rgba(0,0,0,.35)",display:"grid",placeItems:"center"}}><div className="card" style={{padding:22,width:"min(420px,92vw)"}}><h3 style={{marginTop:0}}>ตั้งค่าข้อมูลบน Kanban Card</h3>{orderedSettings.map(([k,l])=>{const i=cardFields.indexOf(k);return <div key={k} style={{display:"grid",gridTemplateColumns:"24px 1fr auto",gap:8,alignItems:"center",padding:"7px 0"}}><input type="checkbox" checked={i>=0} onChange={()=>toggleField(k)}/><span>{l}</span>{i>=0&&<span style={{display:"flex",gap:4}}><button className="btn-ghost" style={{padding:"3px 7px"}} disabled={i<=0} onClick={()=>moveField(k,-1)}>↑</button><button className="btn-ghost" style={{padding:"3px 7px"}} disabled={i<0||i>=cardFields.length-1} onClick={()=>moveField(k,1)}>↓</button></span>}</div>})}<div style={{display:"flex",justifyContent:"flex-end",marginTop:14}}><button className="btn-pink" onClick={()=>setShowCardSettings(false)}>เสร็จ</button></div></div></div>}
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
  const [title, setTitle] = useState(""); const [note, setNote] = useState(""); const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState(""); const [est, setEst] = useState("");
  const [err, setErr] = useState<string | null>(null);
  async function submit() {
    if (!title.trim()) { setErr("กรุณากรอกชื่องาน"); return; }
    onOptimistic(title, assignee, priority, est ? Number(est) : null); // การ์ดโผล่ทันที
    onClose();
    const r = await apiWrite("/api/tasks/create", "POST", { title, note, projectId, statusId, assigneeId: assignee || null, priorityId: priority ? Number(priority) : null, estimatedHours: est ? Number(est) : null });
    onSaved(r.queued ? r.error! : undefined); // sync จริงเบื้องหลัง
  }
  return <Modal title="เพิ่มงาน" onClose={onClose} err={err}>
    <F label="ชื่องาน *"><input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} /></F>
    <F label="รายละเอียด Task"><textarea className="input" rows={5} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="ระบุรายละเอียด ขอบเขต หรือผลลัพธ์ที่ต้องการ" /></F>
    <F label="ผู้รับผิดชอบ"><select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}><option value="">— เลือก —</option>{users.map((u) => <option key={String(u.id)} value={String(u.id)}>{u.label}</option>)}</select></F>
    <F label="Priority"><select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="">— เลือก —</option>{priorities.map((p) => <option key={String(p.id)} value={String(p.id)}>{p.label}</option>)}</select></F>
    <F label="ชั่วโมงประเมิน"><input className="input" type="number" value={est} onChange={(e) => setEst(e.target.value)} /></F>
    <A onClose={onClose} onSave={submit} saving={false} />
  </Modal>;
}
function Modal({ title, children, onClose, err }: { title: string; children: React.ReactNode; onClose: () => void; err: string | null }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}><div className="card" style={{ width: "min(460px,94vw)", padding: 22 }} onClick={(e) => e.stopPropagation()}><h3 style={{ marginTop: 0, color: NAVY }}>{title}</h3>{err && <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: 10, borderRadius: 8, marginBottom: 10 }}>{err}</div>}<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div></div></div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <label style={{ display: "flex", flexDirection: "column", gap: 5 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>{children}</label>; }
function A({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) { return <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}><button className="btn-ghost" onClick={onClose}>ยกเลิก</button><button className="btn-primary" onClick={onSave} disabled={saving}>บันทึก</button></div>; }

function CardValue({value,strong=false}:{value:string;strong?:boolean}){return <div style={{fontSize:15,color:strong?"#374151":"#6B7280",fontWeight:strong?500:400,marginBottom:4,whiteSpace:"normal",overflowWrap:"anywhere"}}>{value}</div>}
