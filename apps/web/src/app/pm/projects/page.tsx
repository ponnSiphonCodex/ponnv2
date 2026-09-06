import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const fmt=(v:number|null)=>v?new Date(v*1000).toLocaleDateString("sv-SE",{timeZone:"Asia/Bangkok"}):"-";
export default async function ProjectsPage(){
 const a=await requireAuth(); if(!a)redirect("/login"); if(a.guest)redirect("/pm/waiting");
 const ids=await visibleProjectIds(a.d1,a.scope); let where=`LOWER(COALESCE(p.status,'active')) NOT IN ('done','completed','closed','cancelled','drop','inactive')`; const binds:any[]=[];
 if(ids){if(!ids.length)where+=' AND 0=1';else{where+=` AND p.id IN (${ids.map(()=>'?').join(',')})`;binds.push(...ids)}}
 const q=await a.d1.prepare(`SELECT p.id,p.name,p.status,p.start_date,p.end_date,pd.name product_name,COALESCE(u.name,u.email) pm_name,(SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) task_count FROM projects p LEFT JOIN products pd ON p.product_id=pd.id LEFT JOIN project_managers pm ON pm.project_id=p.id LEFT JOIN users u ON u.id=pm.user_id WHERE ${where} ORDER BY pd.name,p.name`).bind(...binds).all(); const rows=(q.results??[]) as any[];
 return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project" subtitle={`Active ${rows.length} Project`} actions={a.scope.isPmo?<a className="btn-pink" href="/pm/projects/new" style={{textDecoration:"none"}}>เพิ่ม Project ใหม่</a>:undefined}/><div style={{padding:24}}><div className="project-list-summary"><div><b>Active Projects</b><span>{rows.length} รายการ</span></div></div><div className="project-table-wrap"><table className="data-table"><thead><tr>{["ID","Product","Project","Project Manager","Timeline","Status","Tasks",""].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>PRJ-{String(p.id).padStart(4,'0')}</td><td>{p.product_name??'-'}</td><td><b>{p.name}</b></td><td>{p.pm_name??'-'}</td><td>{fmt(p.start_date)} ถึง {fmt(p.end_date)}</td><td><span className="badge">{p.status??'Active'}</span></td><td>{p.task_count}</td><td><a href={`/pm/board?id=${p.id}`} style={{color:'#EC186E',fontWeight:600}}>เปิด Project</a></td></tr>)}{!rows.length&&<tr><td colSpan={8} style={{padding:32,textAlign:'center',color:'#6B7280'}}>ยังไม่มี Active Project</td></tr>}</tbody></table></div></div></AppShell>
}