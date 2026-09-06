import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic="force-dynamic";
const CLOSED=new Set(["done","completed","closed","cancelled","drop","inactive"]);
const date=(v:number|null|undefined)=>v?new Date(Number(v)*1000).toISOString().slice(0,10):"-";
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const a=await requireAuth();if(!a)redirect("/login");if(a.guest)redirect("/pm/waiting");
 const sp=await searchParams;const view=sp.view==="all"?"all":"active";
 const ids=await visibleProjectIds(a.d1,a.scope);
 if(ids&&ids.length===0)return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List"/><div style={{padding:32,color:"#6B7280"}}>ไม่พบ Project</div></AppShell>;
 const where=ids?` WHERE p.id IN (${ids.map(()=>"?").join(",")})`:"";
 const whereT=ids?` WHERE project_id IN (${ids.map(()=>"?").join(",")})`:"";
 const binds=ids??[];
 const [projRes,tlRes,pmRes]=await Promise.all([
  a.d1.prepare(`SELECT p.id,p.name,p.description,p.status FROM projects p${where} ORDER BY p.name`).bind(...binds).all(),
  a.d1.prepare(`SELECT project_id, MIN(start_date) s, MAX(due_date) e FROM tasks${whereT}${whereT?" AND":" WHERE"} start_date IS NOT NULL GROUP BY project_id`).bind(...binds).all(),
  a.d1.prepare(`SELECT pm.project_id, COALESCE(u.name,u.email,'-') nm FROM project_managers pm LEFT JOIN users u ON u.id=pm.user_id${ids?` WHERE pm.project_id IN (${ids.map(()=>"?").join(",")})`:""}`).bind(...binds).all()
 ]);
 const tl=new Map<number,{s:number;e:number}>();for(const r of (tlRes.results??[]) as any[])tl.set(Number(r.project_id),{s:r.s,e:r.e});
 const pm=new Map<number,string>();for(const r of (pmRes.results??[]) as any[]){const k=Number(r.project_id);if(!pm.has(k))pm.set(k,String(r.nm??"-"))}
 const all=(projRes.results??[]) as any[];
 const rows=view==="active"?all.filter(p=>!CLOSED.has(String(p.status??"active").toLowerCase())):all;
 return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List" actions={<div style={{display:"flex",gap:10}}><div className="seg-group"><a href="/pm/projects?view=active" style={tab(view==="active")}>Active</a><a href="/pm/projects?view=all" style={tab(view==="all")}>ทั้งหมด</a></div>{a.scope.isPmo&&<a className="btn-pink" href="/pm/projects/new" style={{textDecoration:"none"}}>เพิ่ม Project</a>}</div>}/><div style={{padding:24}}><div className="project-table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>Project / รายละเอียด</th><th>Timeline (จาก Task)</th><th>Project Manager</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(p=>{const t=tl.get(Number(p.id));return <tr key={p.id}><td>PRJ-{String(p.id).padStart(4,"0")}</td><td><b>{p.name}</b><div style={{whiteSpace:"pre-wrap",color:"#6B7280",marginTop:5}}>{p.description||"-"}</div></td><td>{t?`${date(t.s)} ถึง ${date(t.e)}`:"-"}</td><td>{pm.get(Number(p.id))??"-"}</td><td><span className="badge">{p.status??"Active"}</span></td><td><a href={`/pm/projects/${p.id}`} style={{color:"#EC186E",fontWeight:700}}>แก้ไข Project</a></td></tr>})}{!rows.length&&<tr><td colSpan={6} style={{padding:32,textAlign:"center",color:"#6B7280"}}>ไม่พบ Project</td></tr>}</tbody></table></div></div></AppShell>
}
function tab(active:boolean):React.CSSProperties{return{display:"inline-block",padding:"7px 13px",borderRadius:6,textDecoration:"none",fontWeight:700,background:active?"#001D58":"transparent",color:active?"#fff":"#6B7280"}}
