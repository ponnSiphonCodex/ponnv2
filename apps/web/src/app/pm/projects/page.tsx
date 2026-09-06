import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic="force-dynamic";
const CLOSED=new Set(["done","completed","closed","cancelled","drop","inactive"]);
const date=(v:number|null)=>v?new Date(v*1000).toISOString().slice(0,10):"-";
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const a=await requireAuth();if(!a)redirect("/login");if(a.guest)redirect("/pm/waiting");
 const sp=await searchParams;const view=sp.view==="all"?"all":"active";const ids=await visibleProjectIds(a.d1,a.scope);
 if(ids&&ids.length===0)return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List"/><div style={{padding:32}}>ไม่พบ Project</div></AppShell>;
 const filter=ids?` WHERE p.id IN (${ids.map(()=>"?").join(",")})`:"";
 const [projectResult,managerResult]=await Promise.all([
  a.d1.prepare(`SELECT p.id,p.name,p.description,p.status,p.start_date,p.end_date FROM projects p${filter} ORDER BY p.name`).bind(...(ids??[])).all(),
  a.d1.prepare(`SELECT pm.project_id,COALESCE(u.name,u.email,'-') AS pm_name FROM project_managers pm LEFT JOIN users u ON u.id=pm.user_id${ids?` WHERE pm.project_id IN (${ids.map(()=>"?").join(",")})`:""} ORDER BY pm.project_id`).bind(...(ids??[])).all()
 ]);
 const managerMap=new Map<number,string>();for(const row of (managerResult.results??[]) as any[]){if(!managerMap.has(Number(row.project_id)))managerMap.set(Number(row.project_id),String(row.pm_name??"-"))}
 const all=(projectResult.results??[]) as any[];const rows=view==="active"?all.filter(p=>!CLOSED.has(String(p.status??"active").toLowerCase())):all;
 return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List" actions={<div style={{display:"flex",gap:10}}><div className="seg-group"><a href="/pm/projects?view=active" style={tab(view==="active")}>Active</a><a href="/pm/projects?view=all" style={tab(view==="all")}>ทั้งหมด</a></div>{a.scope.isPmo&&<a className="btn-pink" href="/pm/projects/new" style={{textDecoration:"none"}}>เพิ่ม Project</a>}</div>}/><div style={{padding:24}}><div className="project-table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>Project / รายละเอียด</th><th>Timeline</th><th>Project Manager</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>PRJ-{String(p.id).padStart(4,"0")}</td><td><b>{p.name}</b><div style={{whiteSpace:"pre-wrap",color:"#6B7280",marginTop:5}}>{p.description||"-"}</div></td><td>{date(p.start_date)} ถึง {date(p.end_date)}</td><td>{managerMap.get(Number(p.id))??"-"}</td><td><span className="badge">{p.status??"Active"}</span></td><td><a href={`/pm/projects/${p.id}`} style={{color:"#EC186E",fontWeight:700}}>แก้ไข Project</a></td></tr>)}{!rows.length&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:"#6B7280"}}>ไม่พบ Project</td></tr>}</tbody></table></div></div></AppShell>
}
function tab(active:boolean):React.CSSProperties{return{display:"inline-block",padding:"7px 13px",borderRadius:6,textDecoration:"none",fontSize:15,fontWeight:700,background:active?"#001D58":"transparent",color:active?"#fff":"#6B7280"}}
