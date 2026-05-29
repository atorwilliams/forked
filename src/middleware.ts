import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// These routes require login
const PROTECTED = [
  /^\/setup(\/|$)/,
  /^\/new(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/[^/]+\/[^/]+\/edit(\/|$)/,
  /^\/[^/]+\/[^/]+\/fork(\/|$)/,
  /^\/[^/]+\/[^/]+\/snap(\/|$)/,
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  const isProtected = PROTECTED.some((p) => p.test(nextUrl.pathname));

  if (isProtected && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
