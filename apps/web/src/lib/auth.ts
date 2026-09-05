/**
 * apps/web/src/lib/auth.ts
 * Auth.js (NextAuth v5) — Google OAuth + Local Email/Password + DrizzleAdapter(D1)
 *
 * ⚠️⚠️ สำคัญมาก: เวอร์ชันนี้ "ตัด" custom jwt.encode/decode ออกแล้ว
 * custom JWT ที่เคยใส่ไว้ (เพื่อให้ Hono API worker แยกมา verify token) เป็น config ไม่มาตรฐาน
 * → ทำให้ Auth.js init ไม่สำเร็จ → เกิด error=Configuration (login ล้มทั้ง Google + Local)
 * นี่คือต้นตอที่แท้จริงของ "Server error / There is a problem with the server configuration"
 *
 * ตอนนี้หน้า board query D1 ตรง ๆ ในตัว (ไม่เรียก API worker แยก) จึงไม่ต้อง share token
 * ข้าม service → ใช้ Auth.js JWT มาตรฐานได้เลย
 */
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import * as schema from "@/db";
import type { DbClient } from "@/db";
import { verifyPassword } from "./password";

export function getAuthConfig(
  db: DbClient,
  env: { AUTH_SECRET: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }
): NextAuthConfig {
  return {
    // @ts-expect-error DrizzleAdapter type คาดหวัง generic ตาม schema ของแต่ละโปรเจกต์
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    providers: [
      Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          if (!email || !password) return null;

          const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
          if (!user || !user.passwordHash) return null;

          const valid = await verifyPassword(password, user.passwordHash);
          if (!valid) return null;

          return { id: user.id, email: user.email, name: user.name };
        },
      }),
    ],
    session: { strategy: "jwt" },
    secret: env.AUTH_SECRET,
    trustHost: true,
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
