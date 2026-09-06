import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDatabase, type Database } from "@/db";
import { getCurrentUser } from "./current-user";
import { getRolesForUser, isAdmin, isGuest, primarySystemRole, type UserRole } from "./rbac";
import { loadScope, type Scope } from "./access";
export type SessionUser = { sub: string; email: string; name: string | null; image: string | null; avatarUrl: string | null };
export type PageAuth = { db: Database; d1: Database; user: SessionUser; realUser: { sub:string; email:string; name:string|null }|null; impersonating:boolean; roles:UserRole[]; admin:boolean; guest:boolean; systemRole:string; roleLabel:string; scope:Scope; env:CloudflareEnv };
export async function requireAuth(): Promise<PageAuth|null> {
  const {env}=await getCloudflareContext({async:true}); const sess=await getCurrentUser(env.AUTH_SECRET); if(!sess)return null; const db=createDatabase(env);
  let actingId=sess.sub,impersonating=false,realUser:null|{sub:string;email:string;name:string|null}=null;
  if(sess.imp&&sess.imp!==sess.sub){const rr=await getRolesForUser(db,sess.sub);if(isAdmin(rr)){actingId=sess.imp;impersonating=true;realUser={sub:sess.sub,email:sess.email,name:sess.name};}}
  const row=await db.prepare(`SELECT id,email,name,image,avatar_url FROM users WHERE id=?`).bind(actingId).first<any>(); if(!row)return null;
  const user={sub:row.id,email:row.email,name:row.name,image:row.image,avatarUrl:row.avatar_url}; const roles=await getRolesForUser(db,actingId),admin=isAdmin(roles),guest=isGuest(roles); const scope=await loadScope(db as any,actingId,admin,guest);
  return {db,d1:db,user,realUser,impersonating,roles,admin,guest,systemRole:primarySystemRole(roles),roleLabel:scope.pmRole?`${primarySystemRole(roles)} · ${scope.pmRole}`:primarySystemRole(roles),scope,env};
}
