/**
 * apps/web/src/lib/auth.ts
 *
 * Auth.js (NextAuth v5) — คงไว้เพื่อใช้ auth() เช็ค session ในหน้าต่าง ๆ
 * ล็อกอินจริงไม่ได้ผ่าน NextAuth Google Provider (OAuth redirect flow ที่เคยพัง
 * บ่อยบน Edge Runtime) — เปลี่ยนไปยิง Google โดยตรงจาก client แล้ว "mint"
 * session token ด้วย signSessionToken() ที่นี่ ให้หน้าตาเหมือนกับที่ NextAuth
 * จะสร้างเป๊ะ ๆ (คุกกี้ชื่อเดียวกัน, เซ็นด้วย secret เดียวกัน) auth() เลยยังอ่าน
 * session นี้ได้ปกติโดยไม่ต้องแก้ middleware/page อื่น
 *
 * ── Session Policy ──────────────────────────────────────────────
 * ผู้ใช้ต้องการให้ login ค้างอยู่ตลอดไปจนกว่าจะ deploy เวอร์ชันใหม่ (ไม่ใช่หมดอายุ
 * ตามเวลา) จึงออกแบบเป็น 2 ชั้น:
 *   1) maxAge ของคุกกี้ยาวมาก (10 ปี) กันหลุดจากเวลา
 *   2) ฝัง claim "ver" = APP_VERSION ปัจจุบันไว้ใน JWT — เวลา decode ถ้า ver
 *      ไม่ตรงกับเวอร์ชันที่รันอยู่ (เพราะ deploy ใหม่แล้วขยับเลข APP_VERSION)
 *      ถือว่า session นี้ใช้ไม่ได้ทันที ต้อง login ใหม่
 * คุกกี้ตั้ง domain=".ponnsth.com" (ไม่ใช่ host-only) เพื่อให้ subdomain ไหนก็ตาม
 * ของ ponnsth.com ใช้ session เดียวกันได้หมด (ดู getCookieDomain ด้านล่าง)
 */
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SignJWT, jwtVerify } from "jose";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import * as schema from "@/db";
import type { DbClient } from "@/db";
import { APP_VERSION } from "@/version";

// 10 ปี — เทียบเท่า "ตลอดไป" ในทางปฏิบัติ ตัวที่บังคับ logout จริงคือเช็ค ver claim
export const SESSION_MAX_AGE_SECONDS = 10 * 365 * 24 * 60 * 60;

function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

/** โดเมนของคุกกี้ — .ponnsth.com ให้ใช้ร่วมกันได้ทุก subdomain, อย่างอื่น (localhost/workers.dev) ปล่อย host-only */
export function getCookieDomain(hostname: string): string | undefined {
  return hostname.endsWith("ponnsth.com") ? ".ponnsth.com" : undefined;
}

export function getSessionCookieName(isHttps: boolean): string {
  return isHttps ? "__Secure-authjs.session-token" : "authjs.session-token";
}

/**
 * สร้าง session JWT (HS256 ธรรมดา ไม่ใช่ JWE) ด้วย secret เดียวกันทั้ง apps/web และ apps/api
 * ฝัง ver = APP_VERSION ปัจจุบันเสมอ
 */
export async function signSessionToken(
  payload: { sub: string; email?: string | null; name?: string | null },
  authSecret: string
): Promise<string> {
  return await new SignJWT({ email: payload.email, name: payload.name, ver: APP_VERSION })
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
          // เวอร์ชันไม่ตรง = ถือว่า session ใช้ไม่ได้แล้ว (บังคับ login ใหม่หลัง deploy)
          if (payload.ver !== APP_VERSION) return null;
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
