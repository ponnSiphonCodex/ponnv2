import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/page-auth";
import { visibleProjectIds } from "@/lib/access";
import { AppShell, PageHeader } from "@/components/app-shell";
import { shellProps } from "@/lib/shell-props";
export const dynamic = "force-dynamic";
const fmt=(v:number|null)=>v?new Date(v*1000).toLocaleDateString("sv-SE",{timeZone:"Asia/Bangkok"}):"-";
const inactive=["done","completed","closed","cancelled","drop","inactive"];
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const a=await requireAuth(); if(!a)redirect("/login"); if(a.guest)redirect("/pm/waiting");
 const sp=await searchParams; const view=sp.view==="all"?"all":"active";
 const ids=await visibleProjectIds(a.d1,a.scope); const binds:any[]=[]; const clauses:string[]=[];
 if(view==="active"){clauses.push(`LOWER(COALESCE(p.status,'active')) NOT IN (${inactive.map(()=>'?').join(',')})`);binds.push(...inactive)}
 if(ids){if(!ids.length)clauses.push('1=0');else{clauses.push(`p.id IN (${ids.map(()=>'?').join(',')})`);binds.push(...ids)}}
 const where=clauses.length?`WHERE ${clauses.join(' AND ')}`:'';
 const q=await a.d1.prepare(`SELECT p.id,p.name,p.status,p.start_date,p.end_date,pd.name AS product_name,(SELECT COUNT(*) FROM tasks t WHERE t.project_id=p.id) AS task_count FROM projects p LEFT JOIN products pd ON p.product_id=pd.id ${where} ORDER BY p.name`).bind(...binds).all();
 const rows=(q.results??[]) as any[];
 const tabs=<div className="seg-group"><a href="/pm/projects?view=active" style={tab(view==="active")}>Active</a><a href="/pm/projects?view=all" style={tab(view==="all")}>ทั้งหมด</a></div>;
 return <AppShell active="project" {...shellProps(a)}><PageHeader title="Project List" subtitle={view==="active"?`Active ${rows.length} Project`:`Project ทั้งหมด ${rows.length} รายการ`} actions={<div style={{display:'flex',gap:10,alignItems:'center'}}>{tabs}{a.scope.isPmo&&<a className="btn-pink" href="/pm/projects/new" style={{textDecoration:"none"}}>เพิ่ม Project</a>}</div>}/><div style={{padding:24}}><div className="project-list-summary"><div><b>{view==="active"?'Active Projects':'All Projects'}</b><span>{rows.length} รายการ</span></div></div><div className="project-table-wrap"><table className="data-table"><thead><tr>{["ID","Product","Project","Timeline","Status","Tasks",""].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map(p=><tr key={p.id}><td>PRJ-{String(p.id).padStart(4,'0')}</td><td>{p.product_name??'-'}</td><td><b>{p.name}</b></td><td>{fmt(p.start_date)} ถึง {fmt(p.end_date)}</td><td><span className="badge">{p.status??'Active'}</span></td><td>{p.task_count}</td><td><a href={`/pm/board?id=${p.id}`} style={{color:'#EC186E',fontWeight:600}}>เปิด Project</a></td></tr>)}{!rows.length&&<tr><td colSpan={7} style={{padding:32,textAlign:'center',color:'#6B7280'}}>ไม่พบ Project</td></tr>}</tbody></table></div></div></AppShell>
}
function tab(active:boolean):React.CSSProperties{return{display:'inline-block',padding:'7px 13px',borderRadius:6,textDecoration:'none',fontSize:13,fontWeight:700,background:active?'#001D58':'transparent',color:active?'#fff':'#6B7280'}}
