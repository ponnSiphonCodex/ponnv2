"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {MultiSelect} from "./multi-select";
import {FileUpload} from "./file-upload";
const PROJECT_CATEGORIES=["AI-Project","Strategic Project","Product","CR","BAU Project","Process Improvement Project","Cross Function Project Improvement","AIx","TX","Data Project"];
type Props={products:any[];features:any[];users:any[];initial?:any;projectId?:number};
type FieldProps={label:string;children:React.ReactNode;wide?:boolean};
// ต้องอยู่นอก ProjectWizard เพื่อไม่ให้ React สร้าง component type ใหม่ทุกครั้งที่พิมพ์
// หากประกาศไว้ข้างใน input จะถูก unmount/remount ทุก keystroke ทำให้ focus หลุดและดูเหมือน UI ค้าง
function F({label,children,wide=false}:FieldProps){return <label className="field-block" style={wide?{gridColumn:"1/-1"}:undefined}><span className="field-label">{label}</span>{children}</label>}
export function ProjectWizard({products,features,users,initial={},projectId}:Props){
 const r=useRouter(),[b,setB]=useState<any>({featureIds:[],teamIds:[],categories:[],status:"Not Start",...initial}),[saving,setSaving]=useState(false),[files,setFiles]=useState<any[]>(initial.files??[]);
 const S=(k:string,v:any)=>setB((x:any)=>({...x,[k]:v}));
 const opts=users.map(x=>({id:x.id,name:x.name}));
 async function save(){if(!b.name||!b.productId||!b.pmId){alert("กรอกข้อมูลจำเป็นไม่ครบ");return}setSaving(true);const url=projectId?`/api/projects/${projectId}`:"/api/projects/create";const res=await fetch(url,{method:projectId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...b,files})});const j=await res.json().catch(()=>({}));setSaving(false);if(res.ok){alert(projectId?"บันทึก Project สำเร็จ":`สร้าง Project สำเร็จ ID: PRJ-${String(j.id).padStart(4,"0")}`);r.push("/pm/projects");r.refresh()}else alert(j.error??"บันทึกไม่สำเร็จ")}
 return <div style={{padding:24,maxWidth:1120}}><div style={{display:"grid",gap:18}}>
  <section className="card form-grid" style={{padding:24}}><h3 className="form-section-title">1. ข้อมูล Project และ Scope</h3><F label="ชื่อ Project *" wide><input className="input" value={b.name??""} onChange={e=>S("name",e.target.value)}/></F><F label="Product *"><select className="input" value={b.productId??""} onChange={e=>{S("productId",Number(e.target.value));S("featureIds",[])}}><option value="">เลือก Product</option>{products.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></F><F label="Status"><select className="input" value={b.status??"Not Start"} onChange={e=>S("status",e.target.value)}>{["Not Start","In Progress","On Hold","Done","Drop"].map(x=><option key={x}>{x}</option>)}</select></F><F label="Category (ติดได้หลาย)" wide><MultiSelect options={PROJECT_CATEGORIES.map(c=>({id:c,name:c}))} value={b.categories??[]} onChange={v=>S("categories",v)} placeholder="เลือก Category ได้หลายรายการ"/></F><F label="Feature ที่นำมาทำ" wide><MultiSelect options={features.filter(x=>!b.productId||x.product_id===b.productId)} value={b.featureIds} onChange={v=>S("featureIds",v.map(Number))} placeholder="เลือก Feature ได้หลายรายการ"/></F><F label="รายละเอียด / Objective" wide><textarea className="input" rows={8} value={b.description??""} onChange={e=>S("description",e.target.value)}/></F></section>

  <section className="card form-grid" style={{padding:24}}><h3 className="form-section-title">2. Owner และ Working Team</h3><F label="Project Manager *"><select className="input" value={b.pmId??""} onChange={e=>S("pmId",e.target.value)}><option value="">เลือก Project Manager</option>{users.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></F><F label="Working Team"><MultiSelect options={opts} value={b.teamIds} onChange={v=>S("teamIds",v)} placeholder="เลือกสมาชิกทีมได้หลายคน"/></F></section>
  <section className="card" style={{padding:24}}><h3 className="form-section-title">3. เอกสาร Project</h3><FileUpload onUploaded={x=>x.ok&&setFiles(v=>[...v,{fileId:x.fileId,url:x.url}])}/>{files.map((f:any,i:number)=><div key={i} style={{marginTop:8}}><a href={f.url} target="_blank">เปิดไฟล์ {i+1}</a></div>)}</section>
  <div style={{display:"flex",justifyContent:"space-between"}}><a className="btn-ghost" href="/pm/projects">ยกเลิก</a><button className="btn-pink" disabled={saving} onClick={save}>{saving?"กำลังบันทึก...":projectId?"บันทึกการแก้ไข":"สร้าง Project"}</button></div>
 </div></div>
}
