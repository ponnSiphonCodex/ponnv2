import {apiContext} from "@/lib/api-auth";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const c=await apiContext();
  if(!c)return Response.json({error:"unauthorized"},{status:401});
  const {id}=await params;
  const b=await req.json() as {title?:string;targetDate?:number};
  if(!b.title?.trim()||!b.targetDate)return Response.json({error:"ข้อมูลไม่ครบ"},{status:400});
  const now=Math.floor(Date.now()/1000);
  await c.d1.prepare(`UPDATE project_milestones SET title=?,target_date=?,updated_by=?,updated_at=? WHERE id=?`).bind(b.title.trim(),b.targetDate,c.me.sub,now,Number(id)).run();
  return Response.json({ok:true});
}
