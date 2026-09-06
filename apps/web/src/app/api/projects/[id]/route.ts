import {apiContext} from "@/lib/api-auth";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const c=await apiContext();
  if(!c||!c.scope.isPmo)return Response.json({error:"forbidden"},{status:403});
  const {id}=await params,pid=Number(id),b=await req.json();
  if(!b.name||!b.productId||!b.pmId)return Response.json({error:"ข้อมูลไม่ครบ"},{status:400});
  const now=Math.floor(Date.now()/1000);
  await c.d1.prepare(`UPDATE projects SET name=?,description=?,status=?,product_id=?,updated_by=?,updated_at=? WHERE id=?`).bind(b.name,b.description??null,b.status??"Not Start",b.productId,c.me.sub,now,pid).run();
  await c.d1.prepare(`DELETE FROM project_managers WHERE project_id=?`).bind(pid).run();
  await c.d1.prepare(`INSERT INTO project_managers(project_id,user_id,created_by,updated_by) VALUES(?,?,?,?)`).bind(pid,b.pmId,c.me.sub,c.me.sub).run();
  for(const fid of b.featureIds??[])await c.d1.prepare(`UPDATE features SET project_id=? WHERE id=? AND product_id=?`).bind(pid,fid,b.productId).run();
  for(const f of b.files??[])if(f.url)await c.d1.prepare(`INSERT INTO attachments(reference_type,reference_id,file_name,gdrive_file_id,gdrive_web_link,uploaded_by) SELECT 'project',?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM attachments WHERE reference_type='project' AND reference_id=? AND gdrive_web_link=?)`).bind(pid,f.fileName??"Project file",f.fileId??null,f.url,c.me.sub,pid,f.url).run();
  return Response.json({ok:true});
}
