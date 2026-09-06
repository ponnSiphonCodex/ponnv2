import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb, type DbClient } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser,isAdmin,isGuest } from "./rbac";
import { loadScope,type Scope } from "./access";
export type ApiCtx={env:CloudflareEnv;d1:DbClient;db:DbClient;me:{sub:string;email:string;name:string|null};realId:string;impersonating:boolean;admin:boolean;guest:boolean;scope:Scope};
export async function apiContext():Promise<ApiCtx|null>{const {env}=await getCloudflareContext({async:true});const sess=await getCurrentUser(env.AUTH_SECRET);if(!sess)return null;const db=createDb(env);let actingId=sess.sub,impersonating=false;if(sess.imp&&sess.imp!==sess.sub){if(isAdmin(await getRolesForUser(db,sess.sub))){actingId=sess.imp;impersonating=true}}const roles=await getRolesForUser(db,actingId),admin=isAdmin(roles),guest=isGuest(roles),scope=await loadScope(db,actingId,admin,guest);const row=await db.prepare(`SELECT id,email,name FROM users WHERE id=?`).bind(actingId).first<any>();if(!row)return null;return{env,d1:db,db,me:{sub:row.id,email:row.email,name:row.name},realId:sess.sub,impersonating,admin,guest,scope}}
