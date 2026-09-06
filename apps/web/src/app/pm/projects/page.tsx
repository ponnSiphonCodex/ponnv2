import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { visibleProjectIds } from "@/lib/access";
import { listProjects } from "@/lib/board-data";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic="force-dynamic";
const CLOSED=new Set(["done","completed","closed","cancelled","drop","inactive"]);
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const a=await requireAuth();if(!a)redirect("/login");if(a.guest)redirect("/pm/waiting");
 const sp=await searchParams;const view=sp.view==="all"?"all":"active";
 const ids=await visibleProjectIds(a.d1,a.scope);const all=await listProjects(a.d1,ids);
 const rows=view==="active"?all.filter(p=>!CLOSED.has(String(p.status??"active").toLowerCase())):all;
 return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List" subtitle={`${view==="active"?"Active":"ทั้งหมด"} ${rows.length} Project`} actions={<div style={{display:"flex",gap:10}}><div className="seg-group"><a href="/pm/projects?view=active" style={tab(view==="active")}>Active</a><a href="/pm/projects?view=all" style={tab(view==="all")}>ทั้งหมด</a></div>{a.scope.isPmo&&<a className="btn-pink" href="/pm/projects/new" style={{textDecoration:"none"}}>เพิ่ม Project</a>}</div>}/><div style={{padding:24}}><div className="project-table-wrap"><table className="data-table"><thead><tr><th>ID</th><th>Project</th><th>Status</th><th></th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>PRJ-{String(p.id).padStart(4,"0")}</td><td><b>{p.name}</b></td><td><span className="badge">{p.status??"Active"}</span></td><td><a href={`/pm/board?id=${p.id}`} style={{color:"#EC186E",fontWeight:700}}>เปิด Project</a></td></tr>)}{!rows.length&&<tr><td colSpan={4} style={{padding:32,textAlign:"center",color:"#6B7280"}}>ไม่พบ Project</td></tr>}</tbody></table></div></div></AppShell>
}
function tab(active:boolean):React.CSSProperties{return{display:"inline-block",padding:"7px 13px",borderRadius:6,textDecoration:"none",fontSize:13,fontWeight:700,background:active?"#001D58":"transparent",color:active?"#fff":"#6B7280"}}
