import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import * as schema from "@/db";
import type { DbClient } from "@/db";
import { verifyPassword } from "./password";

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function getSecretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export function getAuthConfig(
  db: DbClient,
  env: { AUTH_SECRET: string; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }
): NextAuthConfig {
  return {
    // @ts-expect-error DrizzleAdapter type คาดหวัง generic ตาม schema ของแต่ละโปรเจกต์
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users, accountsTable: schema.accounts,
      sessionsTable: schema.sessions, verificationTokensTable: schema.verificationTokens,
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
        if (user) { token.sub = user.id; token.email = user.email; token.name = user.name; }
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
