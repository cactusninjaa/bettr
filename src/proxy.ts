import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/cron",
  "/_next",
  "/favicon",
  "/sounds",
];

const PUBLIC_INVITE_PREFIX = "/invite/";
const PUBLIC_API_INVITE_PREFIX = "/api/invitations/";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return;
  // Allow the invite preview page (auth required only when accepting)
  if (pathname.startsWith(PUBLIC_INVITE_PREFIX) && !pathname.endsWith("/accept")) return;
  if (
    pathname.startsWith(PUBLIC_API_INVITE_PREFIX) &&
    req.method === "GET" &&
    !pathname.endsWith("/accept")
  )
    return;

  if (!req.auth) {
    const callback = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callback}`, req.url),
    );
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sounds).*)"],
};
