import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@/db";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){const {env}=await getCloudflareContext({async:true});const url=new URL(req.url);const checks={SUPABASE_URL_SET:!!env.NEXT_PUBLIC_SUPABASE_URL,SERVICE_ROLE_SET:!!env.SUPABASE_SERVICE_ROLE_KEY,AUTH_SECRET_SET:!!env.AUTH_SECRET,GOOGLE_CLIENT_ID_SET:!!env.GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET_SET:!!env.GOOGLE_CLIENT_SECRET,TELEGRAM_SET:!!env.TELEGRAM_BOT_TOKEN,REDIRECT_URI_USED:`${url.origin}/api/auth/callback/google`};try{const r=await createDb(env).prepare(`SELECT COUNT(*) AS count FROM users`).first<any>();return Response.json({env:checks,db:{ok:true,engine:"Supabase Data API",userCount:Number(r?.count??0)}})}catch(e){return Response.json({env:checks,db:{ok:false,error:e instanceof Error?e.message:String(e)}})}}
