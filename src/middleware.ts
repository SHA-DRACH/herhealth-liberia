import { NextResponse, type NextRequest } from "next/server";

/**
 * Admin area is for signed-in team members only. Requests without a session cookie are sent to
 * the login page (pages) or refused (admin API). Every page and API route still verifies the
 * session and role against the database; this is the first, fast gate.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();
  if (req.cookies.get("hh_admin")?.value) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "authentication required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"] };
