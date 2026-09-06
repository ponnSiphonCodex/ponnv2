import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const DEPLOY_VERSION = "2026-09-06-v33";
const PUBLIC = ["/login", "/api/login", "/api/auth", "/api/logout", "/api/debug"];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!req.cookies.has("session")) return NextResponse.redirect(new URL("/login", req.url));
  if (req.cookies.get("deploy_version")?.value !== DEPLOY_VERSION) { const res = NextResponse.redirect(new URL("/login?reason=new-version", req.url)); res.cookies.delete("session"); res.cookies.set("deploy_version", DEPLOY_VERSION, { path: "/", maxAge: 31536000, sameSite: "lax", secure: true }); return res; }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|ico|svg|jpg|jpeg|webp|gif)$).*)"] };
