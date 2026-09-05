/**
 * apps/web/src/lib/auth.ts
 * Auth.js (NextAuth v5) — คงไว้เพื่อใช้ auth() เช็ค session ในหน้าต่าง ๆ (root page, board page)
 * และคง DrizzleAdapter ไว้เผื่ออนาคตอยากรองรับ Email/Password ด้วย
 *
 * ⚠️ Google Login จริง ๆ ไม่ได้ผ่าน NextAuth provider นี้แล้ว (เคยลองแล้วเจอปัญหา
 * OAuth redirect flow บน Edge Runtime) — เปลี่ยนไปใช้ Google Identity Services (GIS)
 * ยิง ID token ตรงมาที่ apps/web/src/app/api/auth/google/route.ts แทน (วิธีเดียวกับ
 * ที่ทำสำเร็จในโปรเจกต์ Rentals) แล้ว "mint" session token ด้วย signSessionToken()
 * ด้านล่างนี้ ให้หน้าตาเหมือนกับที่ NextAuth จะสร้างเป๊ะ ๆ (คุกกี้ชื่อเดียวกัน,
 * เซ็นด้วย secret เดียวกัน) — ทำให้ auth() ของ NextAuth ยังอ่าน session นี้ได้ปกติ
 * โดยไม่ต้องแก้ไฟล์อื่นเลย (root page.tsx, board page.tsx, middleware.ts)
 */
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SignJWT, jwtVerify } from "jose";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import * as schema from "@/db";
import type { DbClient } from "@/db";

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 วัน — ต้องตรงกับ apps/api ถ้าจะเช็ค exp เอง

function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

/**
 * สร้าง session JWT (HS256 ธรรมดา ไม่ใช่ JWE) ด้วย secret เดียวกันทั้ง apps/web และ apps/api
 * ใช้ทั้งจาก NextAuth's jwt.encode (ด้านล่าง) และจาก /api/auth/google/route.ts โดยตรง
 */
export async function signSessionToken(
  payload: { sub: string; email?: string | null; name?: string | null },
  authSecret: string
): Promise<string> {
  return await new SignJWT({ email: payload.email, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(payload.sub)
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getSecretKey(authSecret));
}

export function getAuthConfig(
  db: DbClient,
  env: { AUTH_SECRET: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }
): NextAuthConfig {
  return {
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    providers: [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })],
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
    secret: env.AUTH_SECRET,
    trustHost: true,
    jwt: {
      maxAge: SESSION_MAX_AGE_SECONDS,
      async encode({ token }) {
        return await signSessionToken(
          { sub: (token?.sub as string) ?? "", email: token?.email as string | undefined, name: token?.name as string | undefined },
          env.AUTH_SECRET
        );
      },
      async decode({ token }) {
        if (!token) return null;
        try {
          const { payload } = await jwtVerify(token, getSecretKey(env.AUTH_SECRET), { algorithms: ["HS256"] });
          return payload as JWT;
        } catch {
          return null;
        }
      },
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.sub = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) session.user.id = token.sub;
        return session;
      },
    },
    pages: { signIn: "/login" },
  };
}
