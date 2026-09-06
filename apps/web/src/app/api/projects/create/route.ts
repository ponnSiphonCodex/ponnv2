import type {NextRequest} from "next/server";
import {apiContext} from "@/lib/api-auth";
export async function POST(req:NextRequest){
  const c=await apiContext();
  if(!c||!c.scope.isPmo)return Response.json({error:"forbidden"},{status:403});
  const b=await req.json();
  if(!b.name||!b.productId||!b.pmId)return Response.json({error:"กรอกข้อมูลจำเป็นไม่ครบ"},{status:400});
  const now=Math.floor(Date.now()/1000);
  const x=await c.d1.prepare(`INSERT INTO projects(name,description,status,product_id,created_by,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) RETURNING id`).bind(b.name,b.description??null,b.status??"Not Start",b.productId,c.me.sub,c.me.sub,now,now).first<any>();
  const id=x.id;
  await c.d1.prepare(`INSERT INTO project_managers(project_id,user_id,created_by,updated_by) VALUES(?,?,?,?)`).bind(id,b.pmId,c.me.sub,c.me.sub).run();
  for(const fid of b.featureIds??[])await c.d1.prepare(`UPDATE features SET project_id=? WHERE id=? AND product_id=?`).bind(id,fid,b.productId).run();
  for(const uid of b.teamIds??[])await c.d1.prepare(`INSERT INTO team_roster(name,responsibility,pm_role,project_id,owner_user_id) SELECT COALESCE(name,email),'Working Team','Working Team',?,? FROM users WHERE id=?`).bind(id,uid,uid).run();
  for(const fl of b.files??[])if(fl.url)await c.d1.prepare(`INSERT INTO attachments(reference_type,reference_id,file_name,gdrive_file_id,gdrive_web_link,uploaded_by) VALUES('project',?,?,?,?,?)`).bind(id,fl.fileName??"Project file",fl.fileId??null,fl.url,c.me.sub).run();
  return Response.json({ok:true,id});
}
