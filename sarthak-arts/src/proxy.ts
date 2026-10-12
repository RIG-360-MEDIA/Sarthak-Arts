import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { resolveRole } from "@/lib/roles";

const PUBLIC = ["/admin/login", "/portal/login", "/account/login", "/account/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll(items) {
        for (const { name, value } of items) req.cookies.set(name, value);
        res = NextResponse.next({ request: req });
        for (const { name, value, options } of items) res.cookies.set(name, value, options);
      },
    },
  });

  // Verifies the token with Supabase and refreshes it when close to expiry.
  const { data } = await supabase.auth.getUser();
  if (PUBLIC.includes(pathname)) return res;

  const role = data.user ? resolveRole(data.user.app_metadata) : null;
  const area = pathname.startsWith("/admin") || pathname.startsWith("/api/admin") ? "admin"
    : pathname.startsWith("/portal") ? "portal" : "account";
  const allowed = area === "admin" ? role === "admin" : area === "portal" ? role === "consultant" : role !== null;
  if (!allowed) {
    const login = area === "admin" ? "/admin/login" : area === "portal" ? "/portal/login" : "/account/login";
    return NextResponse.redirect(new URL(login, req.url));
  }
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*", "/portal/:path*", "/account/:path*"] };
