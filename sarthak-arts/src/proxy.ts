import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public login routes
  if (pathname === "/admin/login" || pathname === "/portal/login") return NextResponse.next();

  const token = req.cookies.get("admin_session")?.value;
  const session = token ? await verifySession(token, process.env.SESSION_SECRET!) : null;

  const isPortal = pathname.startsWith("/portal");
  const requiredRole = isPortal ? "consultant" : "admin";
  const loginUrl = isPortal ? "/portal/login" : "/admin/login";

  if (!session || session.role !== requiredRole)
    return NextResponse.redirect(new URL(loginUrl, req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/portal/:path*"] };
