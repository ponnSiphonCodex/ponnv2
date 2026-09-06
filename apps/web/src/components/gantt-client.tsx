"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cachedFetch, TTL } from "@/lib/cache";
import { Skel } from "./skeleton";
import { MultiSelect } from "./multi-select";

const NAVY = "#001D58", PINK = "#EC186E";
const DAY = 86400;
type Task = { id: number; title: string; start: number; due: number; project_id: number; project_name: string; product_name: string | null; product_id: number | null; assignee_id: string | null; assignee: string | null; category: string | null; feature_id:number|null; feature_name:string|null };
type Milestone = { id: number; title: string; target: number; project_id: number; project_name: string };
type Dep = { pre: number; suc: number; type: string };
type Member = { id: string; name: string };
type Data = { tasks: Task[]; projects: any[]; milestones: Milestone[]; deps: Dep[]; members: Member[] };
type Scale = "day" | "week" | "month";
const SCALE_PX: Record<Scale, number> = { day: 34, week: 14, month: 5 };
const catColor = (c: string | null) => c === "done" ? "#16A34A" : c === "doing" ? "#D4A017" : c === "drop" ? "#DC2626" : c === "todo" ? "#0284C7" : "#64748B";
const ds = (u: number) => new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD เสมอ
const dayFloor = (u: number) => Math.floor(u / DAY) * DAY;

const ROW_H = 34, LABEL_W = 240, HEAD_H = 46;

export function GanttClient({ projects }: { projects: { id: number; name: string }[] }) {
  const [pid, setPid] = useState("all");
  const [productIds,setProductIds]=useState<(number|string)[]>([]); const [featureIds,setFeatureIds]=useState<(number|string)[]>([]); const [projectIds,setProjectIds]=useState<(number|string)[]>([]);
  const [mode, setMode] = useState<"project" | "workforce">("project");
  const [scale, setScale] = useState<Scale>("day");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeStart,setRangeStart]=useState(""); const [rangeEnd,setRangeEnd]=useState("");
  const [draft,setDraft]=useState<{start:number;due:number}|null>(null); const [title,setTitle]=useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(!data);
    cachedFetch<Data>(`gantt:${pid}`, `/api/gantt?id=${pid}`, TTL.realtime, (d) => { setData(d); setLoading(false); });
  }, [pid]);

  const px = SCALE_PX[scale];
  const model = useMemo(() => {
    if (!data) return null;
    const selectedTasks=data.tasks.filter(t=>(!productIds.length||productIds.map(String).includes(String(t.product_id)))&&(!featureIds.length||featureIds.map(String).includes(String(t.feature_id)))&&(!projectIds.length||projectIds.map(String).includes(String(t.project_id)))&&(!rangeStart||t.due>=Date.parse(rangeStart)/1000)&&(!rangeEnd||t.start<=Date.parse(rangeEnd)/1000+DAY-1));
    const items = [...selectedTasks.map((t) => t.start), ...selectedTasks.map((t) => t.due), ...data.milestones.map((m) => m.target)];
    if (!items.length) return { rows: [], min: 0, max: 0, days: 0, taskPos: new Map() };
    let min = dayFloor(Math.min(...items)) - DAY * 2;
    let max = dayFloor(Math.max(...items)) + DAY * 3;
    const days = Math.round((max - min) / DAY);

    type Row = { key: string; label: string; sub?: string; kind: "group" | "task" | "ms"; task?: Task; ms?: Milestone };
    const rows: Row[] = [];
    if (mode === "project") {
      const byProduct = new Map<string, Task[]>();
      for (const t of selectedTasks) { const k = t.product_name || "— ไม่มี Product —"; (byProduct.get(k) ?? byProduct.set(k, []).get(k)!).push(t); }
      for (const [prod, ts] of byProduct) {
        rows.push({ key: `prod:${prod}`, label: prod, kind: "group", sub: "Product" });
        const byProj = new Map<string, Task[]>();
        for (const t of ts) { const k = t.project_name; (byProj.get(k) ?? byProj.set(k, []).get(k)!).push(t); }
        for (const [proj, pts] of byProj) {
          rows.push({ key: `proj:${prod}:${proj}`, label: proj, kind: "group", sub: "Project" });
          for (const t of pts) rows.push({ key: `t${t.id}`, label: t.title, sub: t.assignee ?? "—", kind: "task", task: t });
          for (const m of data.milestones.filter((mm) => mm.project_name === proj)) rows.push({ key: `m${m.id}`, label: m.title, sub: "Milestone", kind: "ms", ms: m });
        }
      }
    } else {
      for (const mem of data.members) {
        const ts = data.tasks.filter((t) => t.assignee_id === mem.id);
        rows.push({ key: `mem:${mem.id}`, label: mem.name || "—", kind: "group", sub: `${ts.length} งาน` });
        for (const t of ts) rows.push({ key: `t${t.id}`, label: t.title, sub: t.project_name, kind: "task", task: t });
      }
      const un = data.tasks.filter((t) => !t.assignee_id);
      if (un.length) { rows.push({ key: "mem:none", label: "ยังไม่มอบหมาย", kind: "group", sub: `${un.length} งาน` }); for (const t of un) rows.push({ key: `t${t.id}`, label: t.title, sub: t.project_name, kind: "task", task: t }); }
    }
    const taskPos = new Map<number, { row: number; left: number; width: number }>();
    rows.forEach((r, i) => { if (r.kind === "task" && r.task) { const left = ((r.task.start - min) / DAY) * px; const width = Math.max(px * 0.6, ((r.task.due - r.task.start) / DAY) * px); taskPos.set(r.task.id, { row: i, left, width }); } });
    return { rows, min, max, days, taskPos };
  }, [data, mode, px, rangeStart, rangeEnd, productIds, featureIds, projectIds]);

  const ticks = useMemo(() => {
    if (!model || !model.days) return [];
    const out: { x: number; label: string; major: boolean }[] = [];
    for (let d = 0; d <= model.days; d++) {
      const t = model.min + d * DAY; const dt = new Date(t * 1000);
      const x = d * px;
      if (scale === "day") out.push({ x, label: `${dt.getUTCDate()}`, major: dt.getUTCDay() === 1 });
      else if (scale === "week") { if (dt.getUTCDay() === 1) out.push({ x, label: ds(t).slice(5), major: dt.getUTCDate() <= 7 }); }
      else { if (dt.getUTCDate() === 1) out.push({ x, label: ds(t).slice(0, 7), major: true }); }
    }
    return out;
  }, [model, px, scale]);

  function exportCSV() {
    if (!data) return;
    const esc = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const rows = [["ID", "Task", "Product", "Project", "ผู้รับผิดชอบ", "เริ่ม", "กำหนดส่ง", "สถานะ", "จำนวนวัน"].map(esc).join(",")];
    for (const t of selectedTasks) rows.push([t.id, t.title, t.product_name, t.project_name, t.assignee, ds(t.start), ds(t.due), t.category, Math.round((t.due - t.start) / DAY)].map(esc).join(","));
    const csv = "\uFEFF" + rows.join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `gantt_${ds(Math.floor(Date.now() / 1000))}.csv`; a.click();
  }

  const chartW = (model?.days ?? 0) * px;
  const chartH = (model?.rows.length ?? 0) * ROW_H;
  const todayX = model ? ((dayFloor(Math.floor(Date.now() / 1000)) - model.min) / DAY) * px : 0;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{width:220}}><span className="field-label">Product</span><MultiSelect placeholder="ทุก Product" options={Array.from(new Map((data?.tasks??[]).filter(x=>x.product_id).map(x=>[String(x.product_id),{id:x.product_id!,name:x.product_name??`Product #${x.product_id}`}])).values())} value={productIds} onChange={setProductIds}/></div><div style={{width:220}}><span className="field-label">Feature</span><MultiSelect placeholder="ทุก Feature" options={Array.from(new Map((data?.tasks??[]).filter(x=>x.feature_id).map(x=>[String(x.feature_id),{id:x.feature_id!,name:x.feature_name??`Feature #${x.feature_id}`}])).values())} value={featureIds} onChange={setFeatureIds}/></div><div style={{width:240}}><span className="field-label">Project</span><MultiSelect placeholder="ทุก Project" options={projects} value={projectIds} onChange={setProjectIds}/></div>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 8, padding: 3, boxShadow: "0 0 0 1px #E5E7EB inset" }}>
          {(["project", "workforce"] as const).map((m) => <button key={m} onClick={() => setMode(m)} style={segBtn(mode === m)}>{m === "project" ? "โหมดโครงการ" : "Workforce Management"}</button>)}
        </div>
        <div style={{ display: "flex", gap: 4, background: "#fff", borderRadius: 8, padding: 3, boxShadow: "0 0 0 1px #E5E7EB inset" }}>
          {(["day", "week", "month"] as const).map((s) => <button key={s} onClick={() => setScale(s)} style={segBtn(scale === s)}>{s === "day" ? "Day" : s === "week" ? "Week" : "Month"}</button>)}
        </div>
        <label className="field-block"><span className="field-label">ช่วงวันที่เริ่ม</span><input className="input" type="date" value={rangeStart} onChange={e=>setRangeStart(e.target.value)}/></label><label className="field-block"><span className="field-label">ถึงวันที่</span><input className="input" type="date" value={rangeEnd} onChange={e=>setRangeEnd(e.target.value)}/></label><button className="btn-ghost" onClick={exportCSV} style={{ marginLeft: "auto" }}>Export Excel</button>
      </div>

      {loading && <div className="card" style={{ padding: 20 }}><Skel w="100%" h={200} /></div>}
      {!loading && model && model.rows.length === 0 && <div className="card" style={{ padding: 40, color: "#6B7280" }}>ยังไม่มีงานที่กำหนดวันเริ่ม + วันส่ง</div>}

      {!loading && model && model.rows.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex" }}>
            <div style={{ width: LABEL_W, minWidth: LABEL_W, borderRight: "2px solid #E5E7EB", background: "#fff", zIndex: 3 }}>
              <div style={{ height: HEAD_H, borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", padding: "0 14px", fontWeight: 700, fontSize: 12.5, color: NAVY, background: "#F9FAFB" }}>{mode === "project" ? "Product / Project / Task" : "ทีม / งาน"}</div>
              {model.rows.map((r) => (
                <div key={r.key} style={{ height: ROW_H, display: "flex", alignItems: "center", padding: r.kind === "group" ? "0 12px" : "0 12px 0 24px", borderBottom: "1px solid #F4F4F6", background: r.kind === "group" ? (r.sub === "Product" ? "#EEF1F6" : "#F7F8FA") : "#fff", fontWeight: r.kind === "group" ? 700 : 500, fontSize: 12.5, color: r.kind === "group" ? NAVY : "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.label}>
                  {r.kind === "ms" ? <span style={{ color: PINK }}>◆ </span> : null}{r.label}{r.kind !== "group" && r.sub && <span style={{ color: "#AEB4C0", fontWeight: 400, marginLeft: 6 }}>· {r.sub}</span>}
                </div>
              ))}
            </div>
            <div ref={scrollRef} style={{ overflowX: "auto", flex: 1 }}>
              <div onClick={(e)=>{if((e.target as HTMLElement).closest("[data-task]"))return;const rect=e.currentTarget.getBoundingClientRect();let u=model.min+Math.floor((e.clientX-rect.left)/px)*DAY;if(scale==="week"){const d=new Date(u*1000),day=d.getUTCDay()||7;u-=(day-1)*DAY}setDraft({start:u,due:u+7*DAY})}} style={{ position: "relative", width: chartW, minWidth: "100%", cursor:"crosshair" }}>
                <div style={{ height: HEAD_H, borderBottom: "1px solid #E5E7EB", position: "relative", background: "#F9FAFB" }}>
                  {ticks.map((t, i) => <div key={i} style={{ position: "absolute", left: t.x, top: 0, bottom: 0, display: "flex", alignItems: "center", fontSize: 10.5, color: t.major ? NAVY : "#AEB4C0", fontWeight: t.major ? 700 : 400, paddingLeft: 3, whiteSpace: "nowrap" }}>{t.label}</div>)}
                </div>
                <div style={{ position: "relative", height: chartH }}>
                  {ticks.map((t, i) => <div key={i} style={{ position: "absolute", left: t.x, top: 0, bottom: 0, width: 1, background: t.major ? "#E5E7EB" : "#F1F3F5" }} />)}
                  {todayX >= 0 && todayX <= chartW && <div style={{ position: "absolute", left: todayX, top: 0, bottom: 0, width: 2, background: PINK, opacity: .5 }} title="Today" /><div style={{position:"absolute",left:todayX+4,top:2,color:PINK,fontWeight:700,fontSize:12}}>TODAY</div>}
                  {model.rows.map((r, i) => <div key={r.key} style={{ position: "absolute", left: 0, right: 0, top: i * ROW_H, height: ROW_H, borderBottom: "1px solid #F4F4F6", background: r.kind === "group" ? (r.sub === "Product" ? "#EEF1F6" : "#F7F8FA") : "transparent" }} />)}

                  <svg style={{ position: "absolute", inset: 0, width: chartW, height: chartH, pointerEvents: "none" }}>
                    <defs><marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#9AA0A6" /></marker></defs>
                    {data && data.deps.map((d, i) => {
                      const a = model.taskPos.get(d.pre), b = model.taskPos.get(d.suc); if (!a || !b) return null;
                      const x1 = a.left + a.width, y1 = a.row * ROW_H + ROW_H / 2;
                      const x2 = b.left, y2 = b.row * ROW_H + ROW_H / 2;
                      const mx = Math.max(x1 + 12, x2 - 12);
                      return <path key={i} d={`M${x1},${y1} H${mx} V${y2} H${x2}`} fill="none" stroke="#9AA0A6" strokeWidth={1.4} markerEnd="url(#arr)" />;
                    })}
                  </svg>

                  {model.rows.map((r, i) => {
                    if (r.kind === "task" && r.task) {
                      const pos = model.taskPos.get(r.task.id)!; const col = catColor(r.task.category);
                      return <div key={r.key} data-task="1" title={`${r.task.title}\n${ds(r.task.start)} → ${ds(r.task.due)}`} style={{ position: "absolute", left: pos.left, top: i * ROW_H + 7, height: ROW_H - 14, width: pos.width, background: col, borderRadius: 5, boxShadow: "0 1px 2px rgba(0,0,0,.12)", display: "flex", alignItems: "center", padding: "0 6px", overflow: "hidden" }}>
                        <span style={{ fontSize: 10.5, color: "#fff", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.task.title}</span>
                      </div>;
                    }
                    if (r.kind === "ms" && r.ms) {
                      const x = ((r.ms.target - model.min) / DAY) * px;
                      return <div key={r.key} title={`${r.ms.title}\n${ds(r.ms.target)}`} style={{ position: "absolute", left: x - 8, top: i * ROW_H + ROW_H / 2 - 8, width: 16, height: 16, background: PINK, transform: "rotate(45deg)", borderRadius: 3 }} />;
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {draft&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:90,display:"grid",placeItems:"center"}}><div className="card" style={{padding:22,width:"min(480px,94vw)"}}><h3 style={{marginTop:0}}>เพิ่ม Task จาก Gantt</h3><label className="field-block"><span className="field-label">ชื่อ Task</span><input autoFocus className="input" value={title} onChange={e=>setTitle(e.target.value)}/></label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><label className="field-block"><span className="field-label">วันเริ่ม</span><input type="date" className="input" value={ds(draft.start)} onChange={e=>setDraft({...draft,start:Date.parse(e.target.value)/1000})}/></label><label className="field-block"><span className="field-label">วันสิ้นสุด</span><input type="date" className="input" value={ds(draft.due)} onChange={e=>setDraft({...draft,due:Date.parse(e.target.value)/1000})}/></label></div><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}><button className="btn-ghost" onClick={()=>setDraft(null)}>ยกเลิก</button><button className="btn-pink" onClick={async()=>{const projectId=projectIds.length===1?Number(projectIds[0]):pid!=="all"?Number(pid):null;if(!projectId){alert("กรุณาเลือก Project เดียวก่อนเพิ่ม Task");return;}const statusId=data?.projects?.find((x:any)=>x.id===projectId)?.first_status_id??1;const res=await fetch("/api/tasks/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,projectId,statusId,startDate:draft.start,dueDate:draft.due})});const j=await res.json();if(res.ok){alert(`สร้าง Task สำเร็จ ID: ${j.id}`);setDraft(null);setTitle("");location.reload()}else alert(j.error) }}>สร้าง Task</button></div></div></div>}
      <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, color: "#6B7280", flexWrap: "wrap" }}>
        {[["#0284C7", "To Do"], ["#D4A017", "In Progress"], ["#16A34A", "Done"], ["#DC2626", "Drop"], ["#64748B", "Backlog"]].map(([c, l]) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: c as string }} />{l}</span>)}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, background: PINK, transform: "rotate(45deg)", borderRadius: 2 }} /> Milestone</span>
      </div>
    </div>
  );
}
function segBtn(active: boolean): React.CSSProperties { return { padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12.5, background: active ? NAVY : "transparent", color: active ? "#fff" : "#6B7280" }; }
