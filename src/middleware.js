import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "9router-default-secret-change-me"
);

const log = (message, data) => {
  console.log(`[middleware] ${message}`, data);
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  log("handling request", { pathname });

  // Protect all dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth_token")?.value;
    log("dashboard auth check", {
      tokenPresent: Boolean(token),
      tokenExcerpt: token ? `${token.slice(0, 8)}…` : undefined,
    });

    if (!token) {
      log("missing token, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      await jwtVerify(token, SECRET);
      log("token valid, allowing dashboard access");
      return NextResponse.next();
    } catch (err) {
      log("token validation failed, redirecting to /login", {
        reason: err?.message,
      });
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirect / to /dashboard if logged in, or /dashboard if it's the root
  if (pathname === "/") {
    log("redirecting root to /dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
