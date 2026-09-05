import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
const PUBLIC_PATHS = ["/login", "/api/login", "/api/auth", "/api/logout", "/api/debug"];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  const hasSession = req.cookies.has("session");
  if (!hasSession) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|ico|svg|jpg|jpeg|webp|gif)$).*)"] };
