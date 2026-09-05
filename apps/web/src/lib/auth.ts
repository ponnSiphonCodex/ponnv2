/**
 * apps/web/src/lib/auth.ts
 * Auth.js (NextAuth v5) + Google OAuth + DrizzleAdapter (D1)
 * sign session เป็น HS256 JWT ธรรมดา (ไม่ใช่ JWE) เพื่อให้ apps/api verify ข้าม service ได้
 */
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SignJWT, jwtVerify } from "jose";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import * as schema from "@/db";
import type { DbClient } from "@/db";

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 วัน — ต้องตรงกับ apps/api ถ้าจะเช็ค exp เอง

function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
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
    session: { strategy: "jwt", maxAge: MAX_AGE_SECONDS },
    secret: env.AUTH_SECRET,
    trustHost: true,
    jwt: {
      maxAge: MAX_AGE_SECONDS,
      async encode({ token }) {
        return await new SignJWT(token as Record<string, unknown>)
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setSubject((token?.sub as string) ?? "")
          .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS)
          .sign(getSecretKey(env.AUTH_SECRET));
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
