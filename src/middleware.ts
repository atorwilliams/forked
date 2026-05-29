import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Requires login only (no email verification — OAuth users land here before verifying)
const AUTH_ONLY = [
  /^\/setup(\/|$)/,
];

// Requires login + verified email
const AUTH_AND_VERIFIED = [
  /^\/new(\/|$)/,
  /^\/settings(\/|$)/,
  /^\/[^/]+\/[^/]+\/edit(\/|$)/,
  /^\/[^/]+\/[^/]+\/fork(\/|$)/,
  /^\/[^/]+\/[^/]+\/snap(\/|$)/,
];

export default auth((req) => {
  const { nextUrl, auth: session } = req;

  const needsAuth = [...AUTH_ONLY, ...AUTH_AND_VERIFIED].some((p) => p.test(nextUrl.pathname));
  const needsVerified = AUTH_AND_VERIFIED.some((p) => p.test(nextUrl.pathname));

  if (needsAuth && !session) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (needsVerified && session && !session.user.emailVerified) {
    return NextResponse.redirect(new URL("/verify-email", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
