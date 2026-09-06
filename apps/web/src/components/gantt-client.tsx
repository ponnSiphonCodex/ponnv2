"use client";

import { useEffect, useMemo, useState } from "react";
import { cachedFetch, TTL } from "@/lib/cache";
import { Skel } from "./skeleton";
import { MultiSelect } from "./multi-select";

const NAVY = "#001D58";
const PINK = "#EC186E";
const DAY = 86400;
const LABEL_W = 330;
const ROW_H = 42;
type Scale = "day" | "week" | "month";
type Task = { id:number; title:string; start:number; due:number; project_id:number; project_name:string; product_id:number|null; product_name:string|null; feature_id:number|null; feature_name:string|null; assignee_id:string|null; assignee:string|null; category:string|null };
type Milestone = { id:number; title:string; target:number; project_id:number; project_name:string };
type Data = { tasks:Task[]; projects:any[]; milestones:Milestone[]; deps:any[]; members:{id:string;name:string}[] };
type Row = { key:string; label:string; sub?:string; kind:"group"|"task"|"milestone"; task?:Task; milestone?:Milestone };

const floorDay = (n:number) => Math.floor(n / DAY) * DAY;
const addDays = (n:number, days:number) => n + days * DAY;
const ymd = (n:number) => new Date(n * 1000).toLocaleDateString("sv-SE", { timeZone:"Asia/Bangkok" });
const statusColor = (c:string|null) => c === "done" ? "#16A34A" : c === "doing" ? "#D4A017" : c === "drop" ? "#DC2626" : c === "todo" ? "#0284C7" : "#64748B";
const monday = (n:number) => { const d = new Date(n * 1000); const day = (d.getUTCDay() + 6) % 7; return n - day * DAY; };

export function GanttClient({ projects: initialProjects }: { projects:{id:number;name:string}[] }) {
  const [data,setData] = useState<Data|null>(null);
  const [projectIds,setProjectIds] = useState<(number|string)[]>([]);
  const [productIds,setProductIds] = useState<(number|string)[]>([]);
  const [featureIds,setFeatureIds] = useState<(number|string)[]>([]);
  const [mode,setMode] = useState<"project"|"workforce">("project");
  const [scale,setScale] = useState<Scale>("week");

  useEffect(() => { cachedFetch<Data>("gantt:all", "/api/gantt?id=all", TTL.realtime, setData); }, []);

  const projectOptions = useMemo(() => {
    const src = data?.projects?.length ? data.projects : initialProjects;
    return src.map((p:any) => ({ id:p.id, name:p.name }));
  }, [data,initialProjects]);
  const productOptions = useMemo(() => Array.from(new Map((data?.tasks ?? []).filter(t=>t.product_id).map(t=>[String(t.product_id),{id:t.product_id!,name:t.product_name || `Product ${t.product_id}`}])).values()),[data]);
  const featureOptions = useMemo(() => Array.from(new Map((data?.tasks ?? []).filter(t=>t.feature_id).map(t=>[String(t.feature_id),{id:t.feature_id!,name:t.feature_name || `Feature ${t.feature_id}`}])).values()),[data]);

  const model = useMemo(() => {
    if (!data) return null;
    const has = (values:(number|string)[], id:any) => !values.length || values.map(String).includes(String(id));
    const tasks = data.tasks.filter(t => has(projectIds,t.project_id) && has(productIds,t.product_id) && has(featureIds,t.feature_id));
    const milestones = data.milestones.filter(m => has(projectIds,m.project_id));
    const points = [...tasks.flatMap(t=>[t.start,t.due]),...milestones.map(m=>m.target)];
    const now = floorDay(Date.now()/1000);
    let min = points.length ? floorDay(Math.min(...points)) : now;
    let max = points.length ? floorDay(Math.max(...points)) : addDays(now,35);
    if (scale === "week") { min = monday(addDays(min,-7)); max = addDays(monday(max),14); }
    else { min = addDays(min,-2); max = addDays(max,3); }
    const rows:Row[] = [];
    if (mode === "project") {
      const products = Array.from(new Set(tasks.map(t=>t.product_name || "ไม่ระบุ Product")));
      for (const product of products) {
        rows.push({key:`product-${product}`,label:product,kind:"group"});
        const pTasks = tasks.filter(t=>(t.product_name || "ไม่ระบุ Product")===product);
        for (const pid of Array.from(new Set(pTasks.map(t=>t.project_id)))) {
          const sample = pTasks.find(t=>t.project_id===pid)!;
          rows.push({key:`project-${pid}`,label:sample.project_name,kind:"group"});
          pTasks.filter(t=>t.project_id===pid).forEach(t=>rows.push({key:`task-${t.id}`,label:t.title,sub:t.assignee || "—",kind:"task",task:t}));
          milestones.filter(m=>m.project_id===pid).forEach(m=>rows.push({key:`ms-${m.id}`,label:m.title,sub:"Milestone",kind:"milestone",milestone:m}));
        }
      }
    } else {
      const names = Array.from(new Set(tasks.map(t=>t.assignee || "ยังไม่ระบุผู้รับผิดชอบ")));
      for (const name of names) {
        rows.push({key:`member-${name}`,label:name,kind:"group"});
        tasks.filter(t=>(t.assignee || "ยังไม่ระบุผู้รับผิดชอบ")===name).forEach(t=>rows.push({key:`task-${t.id}`,label:t.title,sub:t.project_name,kind:"task",task:t}));
      }
    }
    const unitDays = scale === "day" ? 1 : scale === "week" ? 7 : 30;
    const colWidth = scale === "day" ? 48 : scale === "week" ? 132 : 170;
    const count = Math.max(1,Math.ceil((max-min)/DAY/unitDays));
    const width = count * colWidth;
    return { tasks,milestones,rows,min,max,unitDays,colWidth,count,width };
  },[data,projectIds,productIds,featureIds,mode,scale]);

  if (!data || !model) return <div className="card" style={{padding:20}}><Skel h={420}/></div>;
  const pos = (n:number) => ((n-model.min)/DAY/model.unitDays)*model.colWidth;
  const todayX = pos(floorDay(Date.now()/1000));
  const exportCsv = () => {
    const lines = [["Project","Task","Start","Due","Assignee"],...model.tasks.map(t=>[t.project_name,t.title,ymd(t.start),ymd(t.due),t.assignee||""])];
    const blob = new Blob(["\ufeff"+lines.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n")],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="gantt.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  return <div style={{paddingBottom:24}}>
    <div style={{display:"grid",gridTemplateColumns:"minmax(260px,1.15fr) minmax(220px,1fr) minmax(220px,1fr)",gap:14,marginBottom:14}}>
      <MultiSelect options={projectOptions} value={projectIds} onChange={setProjectIds} placeholder="ทุก Project" />
      <MultiSelect options={productOptions} value={productIds} onChange={setProductIds} placeholder="ทุก Product" />
      <MultiSelect options={featureOptions} value={featureIds} onChange={setFeatureIds} placeholder="ทุก Feature" />
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:16}}>
      <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <div style={segmentWrap}><button style={seg(mode==="project")} onClick={()=>setMode("project")}>โหมดโครงการ</button><button style={seg(mode==="workforce")} onClick={()=>setMode("workforce")}>Workforce Management</button></div>
        <div style={segmentWrap}>{(["day","week","month"] as Scale[]).map(s=><button key={s} style={seg(scale===s)} onClick={()=>setScale(s)}>{s==="day"?"Day":s==="week"?"Week":"Month"}</button>)}</div>
      </div>
      <button className="btn-ghost" style={{height:42,padding:"0 18px",fontSize:15}} onClick={exportCsv}>Export Excel</button>
    </div>

    <div style={{border:"1px solid #E5E7EB",borderRadius:14,overflow:"hidden",background:"#fff"}}>
      <div style={{overflowX:"auto"}}>
        <div style={{minWidth:LABEL_W+model.width}}>
          <div style={{display:"grid",gridTemplateColumns:`${LABEL_W}px ${model.width}px`,height:58,borderBottom:"1px solid #E5E7EB",background:"#FAFBFD",position:"sticky",top:0,zIndex:8}}>
            <div style={{padding:"18px 20px",fontWeight:700,color:NAVY,borderRight:"1px solid #E5E7EB"}}>Product / Project / Task</div>
            <div style={{position:"relative",display:"grid",gridTemplateColumns:`repeat(${model.count},${model.colWidth}px)`}}>
              {Array.from({length:model.count},(_,i)=>{ const ts=addDays(model.min,i*model.unitDays); const d=new Date(ts*1000); const label=scale==="day"?d.toLocaleDateString("th-TH",{day:"2-digit",month:"short"}):scale==="week"?d.toLocaleDateString("th-TH",{day:"2-digit",month:"short",year:"numeric"}):d.toLocaleDateString("th-TH",{month:"long",year:"numeric"}); return <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid #EEF0F3",fontSize:13,fontWeight:i%3===1?700:500,color:i%3===1?NAVY:"#9AA0A6",whiteSpace:"nowrap"}}>{label}</div>})}
            </div>
          </div>
          {model.rows.length===0 ? <div style={{padding:50,textAlign:"center",color:"#9AA0A6"}}>ไม่พบข้อมูลตามตัวกรอง</div> : model.rows.map((r,rowIndex)=><div key={r.key} style={{display:"grid",gridTemplateColumns:`${LABEL_W}px ${model.width}px`,height:ROW_H,borderBottom:"1px solid #EEF0F3",background:r.kind==="group"?"#F4F6FA":"#fff"}}>
            <div style={{padding:"9px 20px",borderRight:"1px solid #E5E7EB",fontSize:14,color:r.kind==="group"?NAVY:"#374151",fontWeight:r.kind==="group"?700:400,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              <span style={{paddingLeft:r.kind==="group"?0:20}}>{r.kind==="milestone"?<span style={{color:PINK,marginRight:5}}>◆</span>:null}{r.label}</span>{r.sub&&<span style={{color:"#A1A7B0"}}> · {r.sub}</span>}
            </div>
            <div style={{position:"relative",backgroundImage:`repeating-linear-gradient(to right,transparent 0,transparent ${model.colWidth-1}px,#EEF0F3 ${model.colWidth-1}px,#EEF0F3 ${model.colWidth}px)`}}>
              {scale==="day"&&Array.from({length:model.count},(_,i)=>{const dow=new Date(addDays(model.min,i)*1000).getUTCDay();return (dow===0||dow===6)?<div key={i} style={{position:"absolute",left:i*model.colWidth,top:0,bottom:0,width:model.colWidth,background:"rgba(107,114,128,.055)"}}/>:null})}
              {todayX>=0&&todayX<=model.width&&<div style={{position:"absolute",left:todayX,top:0,bottom:0,width:2,background:"rgba(236,24,110,.48)",zIndex:3}}/>}
              {r.task&&<div title={`${r.task.title}: ${ymd(r.task.start)} - ${ymd(r.task.due)}`} style={{position:"absolute",left:Math.max(2,pos(r.task.start)),top:8,width:Math.max(22,pos(r.task.due+DAY)-pos(r.task.start)-4),height:26,borderRadius:6,background:statusColor(r.task.category),color:"#fff",padding:"4px 9px",fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",boxShadow:"0 1px 3px rgba(0,0,0,.18)",zIndex:4}}>{r.task.title}</div>}
              {r.milestone&&<div title={`${r.milestone.title}: ${ymd(r.milestone.target)}`} style={{position:"absolute",left:pos(r.milestone.target)-9,top:11,width:18,height:18,background:PINK,transform:"rotate(45deg)",borderRadius:2,boxShadow:"0 1px 3px rgba(0,0,0,.2)",zIndex:5}}/>}
            </div>
          </div>)}
        </div>
      </div>
    </div>
    <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",marginTop:14,fontSize:13,color:"#6B7280"}}>
      {[["#0284C7","To Do"],["#D4A017","In Progress"],["#16A34A","Done"],["#DC2626","Drop"],["#64748B","Backlog"]].map(([c,l])=><span key={l} style={{display:"inline-flex",alignItems:"center",gap:6}}><i style={{width:13,height:13,borderRadius:3,background:c}}/>{l}</span>)}
      <span style={{display:"inline-flex",alignItems:"center",gap:7}}><i style={{width:13,height:13,borderRadius:2,background:PINK,transform:"rotate(45deg)"}}/>Milestone</span>
    </div>
  </div>;
}

const segmentWrap:React.CSSProperties={display:"flex",padding:3,border:"1px solid #E5E7EB",borderRadius:10,background:"#fff"};
const seg=(active:boolean):React.CSSProperties=>({height:36,padding:"0 17px",border:0,borderRadius:8,cursor:"pointer",background:active?NAVY:"transparent",color:active?"#fff":"#6B7280",fontWeight:700,fontSize:14});
