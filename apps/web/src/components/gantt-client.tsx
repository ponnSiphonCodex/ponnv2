"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { cachedFetch, TTL } from "@/lib/cache";
import { Skel } from "./skeleton";
import { MultiSelect } from "./multi-select";
import { TaskDrawer } from "./task-drawer";

const NAVY = "#001D58", PINK = "#EC186E";
const DAY = 86400;
type Task = { id: number; title: string; start: number; due: number; project_id: number; project_name: string; product_name: string | null; product_id: number | null; assignee_id: string | null; assignee: string | null; category: string | null; feature_id:number|null; feature_name:string|null; actual_start:number|null; actual_end:number|null; gantt_health:string|null; actual_progress:number|null; project_categories?: string[] };
type Milestone = { id: number; title: string; target: number; project_id: number; project_name: string };
type Dep = { pre: number; suc: number; type: string };
type Member = { id: string; name: string };
type Data = { tasks: Task[]; projects: any[]; milestones: Milestone[]; deps: Dep[]; members: Member[]; refs?: { users:any[]; priorities:any[]; statuses:any[]; features:any[]; tags:any[] } };
type Scale = "day" | "week" | "month";
const SCALE_PX: Record<Scale, number> = { day: 34, week: 15, month: 6 };
const ds = (u: number) => new Date(u * 1000).toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" }); // YYYY-MM-DD เสมอ
const dayFloor = (u: number) => Math.floor(u / DAY) * DAY;

const ROW_H = 50, LABEL_W = 260, HEAD_H = 30;
const PROJECT_CATEGORIES = ["AI-Project","Strategic Project","Product","CR","BAU Project","Process Improvement Project","Cross Function Project Improvement","AIx","TX","Data Project"];

type Row = { key: string; label: string; sub?: string; kind: "group" | "task" | "ms"; task?: Task; ms?: Milestone; projectId?: number; progress?: number; spanStart?: number; spanEnd?: number };

export function GanttClient({ projects }: { projects: { id: number; name: string }[] }) {
  const [productIds,setProductIds]=useState<(number|string)[]>([]); const [featureIds,setFeatureIds]=useState<(number|string)[]>([]); const [projectIds,setProjectIds]=useState<(number|string)[]>([]); const [categoryVals,setCategoryVals]=useState<(number|string)[]>([]);
  const [mode, setMode] = useState<"project" | "workforce">("project");
  const [showProductRows, setShowProductRows] = useState(true);
  const [scale, setScale] = useState<Scale>("week");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangeStart,setRangeStart]=useState(""); const [rangeEnd,setRangeEnd]=useState("");
  const [draft,setDraft]=useState<{start:number;due:number;projectId:number}|null>(null); const [title,setTitle]=useState("");
  const [drawerTask,setDrawerTask]=useState<number|null>(null);
  const [milestoneDraft,setMilestoneDraft]=useState<{projectId:number;target:number}|null>(null);
  const [milestoneTitle,setMilestoneTitle]=useState("");
  const [editMilestone,setEditMilestone]=useState<Milestone|null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(!data);
    cachedFetch<Data>(`gantt:all`, `/api/gantt?id=all`, TTL.realtime, (d) => { setData(d); setLoading(false); });
  }, []);

  const px = SCALE_PX[scale];
  const model = useMemo(() => {
    if (!data) return null;
    const inRange=(a:number,b:number)=>(!rangeStart||b>=Date.parse(rangeStart)/1000)&&(!rangeEnd||a<=Date.parse(rangeEnd)/1000+DAY-1);
    const catMatch=(t:Task)=>!categoryVals.length||(t.project_categories??[]).some(c=>categoryVals.map(String).includes(c));
    const selectedTasks=data.tasks.filter(t=>t.category!=="drop"&&catMatch(t)&&(!productIds.length||productIds.map(String).includes(String(t.product_id)))&&(!featureIds.length||featureIds.map(String).includes(String(t.feature_id)))&&(!projectIds.length||projectIds.map(String).includes(String(t.project_id)))&&inRange(t.start,t.due));
    const selectedMilestones=data.milestones.filter(m=>(!projectIds.length||projectIds.map(String).includes(String(m.project_id)))&&inRange(m.target,m.target));
    const items=[...selectedTasks.map(t=>t.start),...selectedTasks.map(t=>t.due),...selectedMilestones.map(m=>m.target)];
    if (!items.length) return { rows: [] as Row[], min: 0, max: 0, days: 0, taskPos:new Map(), milestones:[] as Milestone[] };
    const min = dayFloor(Math.min(...items)) - DAY * 2;
    const max = dayFloor(Math.max(...items)) + DAY * 3;
    const days = Math.round((max - min) / DAY);

    const rows: Row[] = [];
    if (mode === "project") {
      const byProduct = new Map<string, Task[]>();
      for (const t of selectedTasks) { const k = t.product_name || "— ไม่มี Product —"; (byProduct.get(k) ?? byProduct.set(k, []).get(k)!).push(t); }
      for (const [prod, ts] of byProduct) {
        if (showProductRows) rows.push({ key: `prod:${prod}`, label: prod, kind: "group", sub: "Product", spanStart: Math.min(...ts.map(t=>t.start)), spanEnd: Math.max(...ts.map(t=>t.due)) });
        const byProj = new Map<string, Task[]>();
        for (const t of ts) { const k = t.project_name; (byProj.get(k) ?? byProj.set(k, []).get(k)!).push(t); }
        for (const [proj, pts] of byProj) {
          const done=pts.filter(t=>t.category==="done").length; const progress=pts.length?Math.round(done/pts.length*100):0;
          rows.push({ key: `proj:${prod}:${proj}`, label: proj, kind: "group", sub: "Project", projectId: pts[0]?.project_id, progress, spanStart: Math.min(...pts.map(t=>t.start)), spanEnd: Math.max(...pts.map(t=>t.due)) });
          for (const t of pts) rows.push({ key: `t${t.id}`, label: t.title, sub: t.assignee ?? "—", kind: "task", task: t });
        }
      }
      const overallDone=selectedTasks.filter(t=>t.category==="done").length;
      rows.push({ key:"overall-progress", label:"รวมทุก Project", kind:"group", sub:"Overall", progress:selectedTasks.length?Math.round(overallDone/selectedTasks.length*100):0 });
    } else {
      for (const mem of data.members) {
        const ts = selectedTasks.filter((t) => t.assignee_id === mem.id);
        if (!ts.length) continue;
        rows.push({ key: `mem:${mem.id}`, label: mem.name || "—", kind: "group", sub: `${ts.length} งาน`, spanStart: Math.min(...ts.map(t=>t.start)), spanEnd: Math.max(...ts.map(t=>t.due)) });
        for (const t of ts) rows.push({ key: `t${t.id}`, label: t.title, sub: t.project_name, kind: "task", task: t });
      }
      const un = selectedTasks.filter((t) => !t.assignee_id);
      if (un.length) { rows.push({ key: "mem:none", label: "ยังไม่มอบหมาย", kind: "group", sub: `${un.length} งาน`, spanStart: Math.min(...un.map(t=>t.start)), spanEnd: Math.max(...un.map(t=>t.due)) }); for (const t of un) rows.push({ key: `t${t.id}`, label: t.title, sub: t.project_name, kind: "task", task: t }); }
    }
    const taskPos = new Map<number, { row: number; left: number; width: number }>();
    rows.forEach((r, i) => { if (r.kind === "task" && r.task) { const left = ((r.task.start - min) / DAY) * px; const width = Math.max(px * 0.6, ((r.task.due - r.task.start) / DAY) * px); taskPos.set(r.task.id, { row: i, left, width }); } });
    return { rows, min, max, days, taskPos, milestones:selectedMilestones };
  }, [data, mode, px, rangeStart, rangeEnd, productIds, featureIds, projectIds, categoryVals, showProductRows]);

  // ป้ายกำกับหัวตาราง จัดกึ่งกลางในแต่ละช่วง (วัน = ตัวเลขวันที่, สัปดาห์ = วันจันทร์, เดือน = ไม่แสดง เพราะมี month band ด้านบนแล้ว)
  const ticks = useMemo(() => {
    if (!model || !model.days) return [] as { x: number; width: number; label: string; major: boolean }[];
    const out: { x: number; width: number; label: string; major: boolean }[] = [];
    for (let d = 0; d <= model.days; d++) {
      const t = model.min + d * DAY; const dt = new Date(t * 1000); const x = d * px;
      if (scale === "day") out.push({ x, width: px, label: `${dt.getUTCDate()}`, major: dt.getUTCDay() === 1 });
      else if (scale === "week") { if (dt.getUTCDay() === 1) out.push({ x, width: 7 * px, label: ds(t).slice(5), major: dt.getUTCDate() <= 7 }); }
    }
    return out;
  }, [model, px, scale]);

  // เส้นแนวตั้ง เฉพาะขอบของช่วง (วัน=ทุกวัน, สัปดาห์=จันทร์, เดือน=วันที่1)
  const gridLines = useMemo(() => {
    if (!model || !model.days) return [] as number[];
    const xs: number[] = [];
    for (let d = 0; d <= model.days; d++) {
      const dt = new Date((model.min + d * DAY) * 1000); const x = d * px;
      if (scale === "day") xs.push(x);
      else if (scale === "week") { if (dt.getUTCDay() === 1) xs.push(x); }
      else { if (dt.getUTCDate() === 1) xs.push(x); }
    }
    return xs;
  }, [model, px, scale]);

  const visibleTasks = useMemo(() => (data?.tasks ?? []).filter(t=>t.category!=="drop"&&(!productIds.length||productIds.map(String).includes(String(t.product_id)))&&(!featureIds.length||featureIds.map(String).includes(String(t.feature_id)))&&(!projectIds.length||projectIds.map(String).includes(String(t.project_id)))&&(!rangeStart||t.due>=Date.parse(rangeStart)/1000)&&(!rangeEnd||t.start<=Date.parse(rangeEnd)/1000+DAY-1)), [data,productIds,featureIds,projectIds,rangeStart,rangeEnd]);

  function exportCSV() {
    if (!data) return;
    const esc = (v: any) => `"${(v ?? "").toString().replace(/"/g, '""')}"`;
    const rows = [["ID", "Task", "Product", "Project", "ผู้รับผิดชอบ", "เริ่ม", "กำหนดส่ง", "สถานะ", "จำนวนวัน"].map(esc).join(",")];
    for (const t of visibleTasks) rows.push([t.id, t.title, t.product_name, t.project_name, t.assignee, ds(t.start), ds(t.due), t.category, Math.round((t.due - t.start) / DAY)].map(esc).join(","));
    const csv = "\uFEFF" + rows.join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `gantt_${ds(Math.floor(Date.now() / 1000))}.csv`; a.click();
  }

  const chartW = (model?.days ?? 0) * px;
  const chartH = (model?.rows.length ?? 0) * ROW_H;
  const monthBands = useMemo(() => {
    if (!model?.days) return [] as { key: string; label: string; left: number; width: number }[];
    const bands: { key: string; label: string; left: number; width: number }[] = [];
    let start = 0; let key = "";
    for (let d = 0; d <= model.days; d++) {
      const dt = new Date((model.min + d * DAY) * 1000);
      const nextKey = `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`;
      if (!key) key = nextKey;
      if (nextKey !== key || d === model.days) {
        const end = d === model.days ? d + 1 : d;
        const first = new Date((model.min + start * DAY) * 1000);
        bands.push({ key, label: first.toISOString().slice(0, 7), left: start * px, width: Math.max(px, (end - start) * px) });
        start = d; key = nextKey;
      }
    }
    return bands;
  }, [model, px]);
  const todayX = model ? ((dayFloor(Math.floor(Date.now() / 1000)) - model.min) / DAY) * px : 0;

  return (
    <div style={{ padding: 20 }}>
      <div className="gantt-filters gantt-filters-4">
        <div><span className="field-hint">Project</span><MultiSelect placeholder="ทุก Project" options={projects} value={projectIds} onChange={setProjectIds}/></div>
        <div><span className="field-hint">Category</span><MultiSelect placeholder="ทุก Category" options={PROJECT_CATEGORIES.map(c=>({id:c,name:c}))} value={categoryVals} onChange={setCategoryVals}/></div>
        <div><span className="field-hint">Product</span><MultiSelect placeholder="ทุก Product" options={Array.from(new Map((data?.tasks??[]).filter(x=>x.product_id).map(x=>[String(x.product_id),{id:x.product_id!,name:x.product_name??`Product #${x.product_id}`}])).values())} value={productIds} onChange={setProductIds}/></div>
        <div><span className="field-hint">Feature</span><MultiSelect placeholder="ทุก Feature" options={Array.from(new Map((data?.tasks??[]).filter(x=>x.feature_id).map(x=>[String(x.feature_id),{id:x.feature_id!,name:x.feature_name??`Feature #${x.feature_id}`}])).values())} value={featureIds} onChange={setFeatureIds}/></div>
      </div>
      <div className="gantt-toolbar">
        <div className="seg-group">{(["project","workforce"] as const).map(m=><button key={m} onClick={()=>setMode(m)} style={segBtn(mode===m)}>{m==="project"?"โหมดโครงการ":"Workforce Management"}</button>)}</div><button className="btn-ghost" onClick={()=>setShowProductRows(v=>!v)} style={{background:showProductRows?"#fff":"#F4F4F6",color:showProductRows?NAVY:"#6B7280"}}>{showProductRows?"✓ แสดง Product":"แสดง Product"}</button>
        <div className="seg-group">{(["day","week","month"] as const).map(v=><button key={v} onClick={()=>setScale(v)} style={segBtn(scale===v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div>
        <button className="btn-ghost" onClick={()=>{setMilestoneDraft({projectId:Number(projectIds[0]??projects[0]?.id??0),target:dayFloor(Math.floor(Date.now()/1000))});}} style={{marginLeft:"auto"}}>◆ เพิ่ม Milestone</button><button className="btn-ghost" onClick={exportCSV}>Export</button>
      </div>
      {loading && <div className="card" style={{ padding: 20 }}><Skel w="100%" h={200} /></div>}
      {!loading && model && model.rows.length === 0 && <div className="card" style={{ padding: 40, color: "#6B7280" }}>ยังไม่มีงานที่กำหนดวันเริ่ม + วันส่ง</div>}

      {!loading && model && model.rows.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex" }}>
            {/* ---------- Left label panel ---------- */}
            <div style={{ width: LABEL_W, minWidth: LABEL_W, borderRight: "2px solid #E5E7EB", background: "#fff", zIndex: 3 }}>
              <div className="month-band" />
              <div style={{ height: HEAD_H, display: "flex", alignItems: "center", padding: "0 14px", fontWeight: 700, color: NAVY, background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>{mode === "project" ? "Product / Project / Task" : "ทีม / งาน"}</div>
              {model.rows.map((r) => (
                <div key={r.key} style={{ height: ROW_H, display: "flex", alignItems: "center", padding: r.kind === "group" ? "0 12px" : "0 12px 0 26px", borderBottom: "1px solid #F4F4F6", background: r.kind === "group" ? (r.sub === "Product" ? "#E9EDF4" : r.sub === "Overall" ? "#FDECF3" : "#F5F7FA") : "#fff" }} title={r.label}>
                  <div style={{ width:"100%", minWidth:0 }}>
                    <div style={{ fontWeight: r.kind === "group" ? 700 : 500, color: r.kind === "group" ? NAVY : "#374151", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.label}{r.kind === "task" && r.sub && <span style={{ color: "#AEB4C0", fontWeight: 400, marginLeft: 6 }}>· {r.sub}</span>}</div>
                    {r.progress!=null && <div style={{display:"flex",alignItems:"center",gap:7,marginTop:3}}><div style={{height:5,background:"#E5E7EB",borderRadius:3,flex:1,overflow:"hidden"}}><div style={{height:"100%",width:`${r.progress}%`,background:r.sub==="Overall"?NAVY:PINK}}/></div><span style={{color:r.sub==="Overall"?NAVY:PINK,fontWeight:700}}>{r.progress}%</span></div>}
                  </div>
                </div>
              ))}
            </div>

            {/* ---------- Right timeline ---------- */}
            <div ref={scrollRef} style={{ overflowX: "auto", flex: 1 }}>
              <div style={{ position: "relative", width: chartW, minWidth: "100%" }}>
                {/* gridlines ครอบทั้งหัววันที่ + ตัวกราฟ */}
                {gridLines.map((x, i) => <div key={`grid-${i}`} style={{ position: "absolute", left: x, top: 24, bottom: 0, width: 1, background: "#E5E7EB", opacity: .7, pointerEvents: "none" }} />)}

                {/* month band */}
                <div className="month-band">{monthBands.map(b=><span key={b.key} style={{position:"absolute",left:b.left,width:b.width,textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}>{b.label}</span>)}</div>

                {/* header วัน/สัปดาห์ จัดกึ่งกลาง */}
                <div style={{ height: HEAD_H, position: "relative", background: "transparent", borderBottom: "1px solid #E5E7EB" }}>
                  {ticks.map((t, i) => <div key={i} style={{ position: "absolute", left: t.x, width: t.width, top: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", color: t.major ? NAVY : "#9AA0A6", fontWeight: t.major ? 700 : 500, zIndex: 2 }}>{t.label}</div>)}
                </div>

                {/* body */}
                <div onClick={(e)=>{if((e.target as HTMLElement).closest("[data-task]"))return;const rect=e.currentTarget.getBoundingClientRect();const rowIndex=Math.floor((e.clientY-rect.top)/ROW_H);const row=model.rows[rowIndex];const targetProjectId=row?.projectId??row?.task?.project_id;if(!row||!targetProjectId||(row.kind==="group"&&row.sub!=="Project"))return;let u=model.min+Math.floor((e.clientX-rect.left)/px)*DAY;if(scale==="week"){const d=new Date(u*1000),day=d.getUTCDay()||7;u-=(day-1)*DAY}setDraft({start:u,due:u+7*DAY,projectId:targetProjectId})}} style={{ position: "relative", height: chartH, cursor: "default" }}>
                  {/* weekend shading เฉพาะ day/week */}
                  {scale==="day" && Array.from({length:model.days+1},(_,d)=>{const dt=new Date((model.min+d*DAY)*1000),we=dt.getUTCDay()===0||dt.getUTCDay()===6;return we?<div key={`we-${d}`} style={{position:"absolute",left:d*px,top:0,bottom:0,width:px,background:"rgba(107,114,128,.05)",pointerEvents:"none"}}/>:null})}

                  {todayX >= 0 && todayX <= chartW && <div style={{ position: "absolute", left: todayX, top: 0, bottom: 0, width: 2, background: PINK, opacity: .45 }} />}

                  {/* row backgrounds — Product/Project/Overall เป็นสีทึบเพื่อบังเส้นแนวตั้งของวันที่ */}
                  {model.rows.map((r, i) => <div key={r.key} style={{ position: "absolute", left: 0, right: 0, top: i * ROW_H, height: ROW_H, borderBottom: "1px solid #F4F4F6", background: r.kind === "group" ? (r.sub === "Product" ? "#E9EDF4" : r.sub === "Overall" ? "#FDECF3" : "#F5F7FA") : "transparent", cursor: (r.sub === "Project" || r.kind === "task") ? "copy" : "default" }} />)}

                  {/* dependency arrows */}
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

                  {/* task bars — Plan (บน) + Actual (ล่าง) ไม่มี Summary bar แล้ว */}
                  {model.rows.map((r, i) => {
                    if (r.kind === "task" && r.task) {
                      const pos = model.taskPos.get(r.task.id)!;
                      const now = Math.floor(Date.now() / 1000);
                      const aStart = r.task.actual_start, aEnd = r.task.actual_end;
                      const actualColor = r.task.gantt_health === "green" ? "#16A34A" : r.task.gantt_health === "yellow" ? "#D4A017" : r.task.gantt_health === "red" ? "#DC2626" : null;
                      const aLeft = aStart != null ? ((aStart - model.min) / DAY) * px : pos.left;
                      const progress = Math.max(0, Math.min(100, Number(r.task.actual_progress ?? 0)));
                      const actualDurationWidth = aStart != null && aEnd != null ? Math.max(px * 0.5, ((aEnd - aStart) / DAY) * px) : pos.width;
                      const aWidth = Math.max(progress > 0 ? px * .35 : 0, actualDurationWidth * progress / 100);
                      return <div key={r.key} data-task="1" onClick={(e)=>{e.stopPropagation();setDrawerTask(r.task!.id)}} title={`${r.task.title}\nPlan: ${ds(r.task.start)} → ${ds(r.task.due)}${aStart!=null?`\nActual: ${ds(aStart)}${aEnd!=null?` → ${ds(aEnd)}`:""}`:""}`} style={{ position: "absolute", left: 0, top: i * ROW_H + 9, height: ROW_H - 18, width: "100%", cursor: "pointer", zIndex: 6 }}>
                        <div style={{ position: "absolute", left: pos.left, width: pos.width, minWidth: 10, top: 1, height: 9, background: "#D1D5DB", borderRadius: 4 }} />
                        {actualColor && <div style={{ position: "absolute", left: aLeft, width: aWidth, minWidth: 10, bottom: 1, height: 9, background: actualColor, borderRadius: 4 }} />}
                        <span style={{ position: "absolute", left: pos.left + pos.width + 8, top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap", color: "#4B5563", pointerEvents: "none" }}>{r.task.title}{r.task.actual_progress!=null?` · ${progress}%`:""}</span>
                      </div>;
                    }
                    return null;
                  })}

                  {/* milestones: เพชรอยู่แถว Project ลากเส้นลงถึงงานสุดท้ายของ Project */}
                  {model.milestones.map((m, milestoneIndex) => {
                    const x = ((m.target - model.min) / DAY) * px;
                    const projectRow = model.rows.findIndex((r) => r.sub === "Project" && r.projectId === m.project_id);
                    if (projectRow < 0) return null;
                    const nextBoundary = model.rows.findIndex((r, index) => index > projectRow && r.kind === "group");
                    const projectEndRow = nextBoundary < 0 ? model.rows.length : nextBoundary;
                    const y = projectRow * ROW_H + ROW_H / 2;
                    const height = Math.max(ROW_H / 2, projectEndRow * ROW_H - y);
                    // Auto Stack 3 ชั้น: Milestone ที่อยู่ใกล้กันภายใน ~160px จะสลับระดับ Label 0/1/2
                    const nearbyBefore = model.milestones.slice(0, milestoneIndex).filter(prev => {
                      const prevX = ((prev.target - model.min) / DAY) * px;
                      return prev.project_id === m.project_id && Math.abs(x - prevX) < 160;
                    }).length;
                    const stackLevel = nearbyBefore % 3;
                    const labelTop = -12 + stackLevel * 28;
                    return <div key={`milestone-${m.id}`} onClick={(e)=>{e.stopPropagation();setEditMilestone(m);setMilestoneTitle(m.title)}} title={`${m.title} · ${ds(m.target)}`} style={{ position: "absolute", left: x, top: y, height, width: 2, background: PINK, opacity: .85, zIndex: 8, cursor: "pointer" }}>
                      <span style={{ position: "absolute", left: -7, top: -7, width: 14, height: 14, background: PINK, transform: "rotate(45deg)", borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,.18)" }} />
                      <span style={{ position: "absolute", left: 13, top: labelTop, padding: "3px 8px", background: "#fff", color: NAVY, border: `1px solid ${PINK}`, borderRadius: 5, fontWeight: 700, whiteSpace: "nowrap", boxShadow: "0 1px 3px rgba(0,0,0,.10)" }}>{m.title} · {ds(m.target)}</span>
                    </div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editMilestone&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:92,display:"grid",placeItems:"center"}}><div className="card" style={{padding:22,width:"min(480px,94vw)"}}><h3 style={{marginTop:0}}>แก้ไข Milestone</h3><label className="field-block"><span className="field-label">ชื่อ Milestone</span><input className="input" value={milestoneTitle} onChange={e=>setMilestoneTitle(e.target.value)}/></label><label className="field-block" style={{marginTop:12}}><span className="field-label">วันที่เป้าหมาย</span><input type="date" className="input" value={ds(editMilestone.target)} onChange={e=>setEditMilestone({...editMilestone,target:Date.parse(e.target.value)/1000})}/></label><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}><button className="btn-ghost" onClick={()=>setEditMilestone(null)}>ยกเลิก</button><button className="btn-pink" onClick={async()=>{const r=await fetch(`/api/milestones/${editMilestone.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:milestoneTitle,targetDate:editMilestone.target})});if(r.ok)location.reload();else alert("บันทึกไม่สำเร็จ")}}>บันทึก</button></div></div></div>}
      {milestoneDraft&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:91,display:"grid",placeItems:"center"}}><div className="card" style={{padding:22,width:"min(480px,94vw)"}}><h3 style={{marginTop:0}}>เพิ่ม Milestone</h3><label className="field-block"><span className="field-label">Project</span><select className="input" value={milestoneDraft.projectId} onChange={e=>setMilestoneDraft({...milestoneDraft,projectId:Number(e.target.value)})}><option value="">เลือก Project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="field-block" style={{marginTop:12}}><span className="field-label">ชื่อ Milestone</span><input autoFocus className="input" value={milestoneTitle} onChange={e=>setMilestoneTitle(e.target.value)}/></label><label className="field-block" style={{marginTop:12}}><span className="field-label">วันที่เป้าหมาย</span><input type="date" className="input" value={ds(milestoneDraft.target)} onChange={e=>setMilestoneDraft({...milestoneDraft,target:Date.parse(e.target.value)/1000})}/></label><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}><button className="btn-ghost" onClick={()=>setMilestoneDraft(null)}>ยกเลิก</button><button className="btn-pink" onClick={async()=>{if(!milestoneDraft.projectId){alert("กรุณาเลือก Project");return}if(!milestoneTitle.trim())return;const res=await fetch("/api/milestones/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({projectId:milestoneDraft.projectId,title:milestoneTitle.trim(),targetDate:milestoneDraft.target})});if(res.ok){setMilestoneDraft(null);setMilestoneTitle("");location.reload()}else alert((await res.json()).error||"สร้าง Milestone ไม่สำเร็จ")}}>สร้าง Milestone</button></div></div></div>}
      {draft&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:90,display:"grid",placeItems:"center"}}><div className="card" style={{padding:22,width:"min(480px,94vw)"}}><h3 style={{marginTop:0}}>เพิ่ม Task จาก Gantt</h3><label className="field-block"><span className="field-label">ชื่อ Task</span><input autoFocus className="input" value={title} onChange={e=>setTitle(e.target.value)}/></label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}><label className="field-block"><span className="field-label">วันเริ่ม</span><input type="date" className="input" value={ds(draft.start)} onChange={e=>setDraft({...draft,start:Date.parse(e.target.value)/1000})}/></label><label className="field-block"><span className="field-label">วันสิ้นสุด</span><input type="date" className="input" value={ds(draft.due)} onChange={e=>setDraft({...draft,due:Date.parse(e.target.value)/1000})}/></label></div><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:18}}><button className="btn-ghost" onClick={()=>setDraft(null)}>ยกเลิก</button><button className="btn-pink" onClick={async()=>{const projectId=draft.projectId;const statusId=data?.projects?.find((x:any)=>x.id===projectId)?.first_status_id??1;const res=await fetch("/api/tasks/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,projectId,statusId,startDate:draft.start,dueDate:draft.due})});const j=await res.json();if(res.ok){alert(`สร้าง Task สำเร็จ ID: ${j.id}`);setDraft(null);setTitle("");location.reload()}else alert(j.error) }}>สร้าง Task</button></div></div></div>}
      {drawerTask != null && <TaskDrawer taskId={drawerTask} users={data?.refs?.users??[]} priorities={data?.refs?.priorities??[]} statuses={data?.refs?.statuses??[]} features={data?.refs?.features??[]} tags={data?.refs?.tags??[]} onClose={()=>setDrawerTask(null)} onChanged={()=>{}} onNeedsReload={()=>location.reload()} />}

      <div style={{ display: "flex", gap: 16, marginTop: 12, color: "#6B7280", flexWrap: "wrap", alignItems: "center" }}>
        {[["#D1D5DB", "Plan"], ["#16A34A", "Actual · Done"], ["#D4A017", "Actual · เสี่ยง Delay"], ["#DC2626", "Actual · Delay"]].map(([c, l]) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 8, borderRadius: 3, background: c as string }} />{l}</span>)}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: PINK, transform: "rotate(45deg)", borderRadius: 2 }} /> Milestone</span>
      </div>
    </div>
  );
}
function segBtn(active: boolean): React.CSSProperties { return { padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, background: active ? NAVY : "transparent", color: active ? "#fff" : "#6B7280" }; }
