import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { sanitizeCallbackUrl } from "@/lib/callback-url";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!isLoggedIn && pathname !== "/login") {
    const loginUrl = new URL("/login", req.nextUrl);
    const callbackPath = `${pathname}${req.nextUrl.search}`;
    loginUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && pathname === "/login") {
    const callbackUrl = sanitizeCallbackUrl(
      req.nextUrl.searchParams.get("callbackUrl")
    );
    return NextResponse.redirect(new URL(callbackUrl, req.nextUrl));
  }

  if (pathname.startsWith("/users") && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
