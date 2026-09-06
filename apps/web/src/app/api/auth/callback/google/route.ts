import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase } from "@/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
import { notifyAdminChat } from "@/lib/notify";
export const dynamic = "force-dynamic";
function fail(origin:string, error:string, detail?:string){ const q=new URLSearchParams({error}); if(detail)q.set("detail",detail.slice(0,300)); return Response.redirect(`${origin}/login?${q}`,302); }
export async function GET(req:NextRequest){
  const {env}=await getCloudflareContext({async:true}); const db=createDatabase(env); const u=new URL(req.url), origin=u.origin, code=u.searchParams.get("code"), redirectUri=`${origin}/api/auth/callback/google`;
  if(u.searchParams.get("error")) return fail(origin,"OAuthCallback",u.searchParams.get("error")!); if(!code)return fail(origin,"OAuthCallback","no code");
  try {
    const tr=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,redirect_uri:redirectUri,grant_type:"authorization_code"})});
    if(!tr.ok)return fail(origin,"OAuthSignin",await tr.text()); const tok=await tr.json() as any;
    const pr=await fetch("https://www.googleapis.com/oauth2/v2/userinfo",{headers:{Authorization:`Bearer ${tok.access_token}`}}); if(!pr.ok)return fail(origin,"OAuthSignin",await pr.text()); const p=await pr.json() as any;
    const allowed=(env.ALLOWED_DOMAINS??"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean); const domain=(p.email?.split("@")[1]??"").toLowerCase(); if(allowed.length&&!allowed.includes(domain))return fail(origin,"OAuthSignin",`domain ${domain}`);
    let user=await db.prepare(`SELECT id,email,name,active FROM users WHERE email=?`).bind(p.email).first<any>(); const isNew=!user;
    if(!user){const id=crypto.randomUUID();await db.prepare(`INSERT INTO users(id,email,name,image) VALUES(?,?,?,?)`).bind(id,p.email,p.name??null,p.picture??null).run();user={id,email:p.email,name:p.name??null,active:1};}
    else if(p.picture)await db.prepare(`UPDATE users SET image=? WHERE id=?`).bind(p.picture,user.id).run();
    if(!user.active&&!isNew)return fail(origin,"OAuthSignin","บัญชีถูกปิดใช้งาน");
    if(isNew){const g=await db.prepare(`SELECT id FROM system_roles WHERE role_name='Guest' LIMIT 1`).first<any>();if(g)await db.prepare(`INSERT INTO user_roles(user_id,role_id) VALUES(?,?) ON CONFLICT(user_id,role_id) DO NOTHING`).bind(user.id,g.id).run();}
    await db.prepare(`INSERT INTO login_logs(user_id,email,auth_provider,device_info,ip_address,success) VALUES(?,?,?,?,?,1)`).bind(user.id,user.email,"Google",req.headers.get("user-agent")?.slice(0,180)??null,req.headers.get("cf-connecting-ip")??null).run(); await db.prepare(`UPDATE users SET last_login_at=unixepoch() WHERE id=?`).bind(user.id).run();
    const when=new Date().toLocaleString("sv-SE",{timeZone:"Asia/Bangkok"}).slice(0,16)+" น."; await notifyAdminChat(env,isNew?`🆕 <b>ผู้ใช้ใหม่เข้าระบบ</b>\n${p.name??p.email}\n${p.email}\nGoogle · ${when}`:`🔑 <b>เข้าสู่ระบบ</b>\n${user.name??user.email} (Google)\n${when}`);
    const token=await createSessionToken(env.AUTH_SECRET,{sub:user.id,email:user.email,name:user.name}); const res=new Response(null,{status:302,headers:{Location:`${origin}/`}}); res.headers.append("Set-Cookie",buildSessionCookie(token)); return res;
  } catch(e){ return fail(origin,"OAuthSignin",e instanceof Error?e.message:String(e)); }
}
