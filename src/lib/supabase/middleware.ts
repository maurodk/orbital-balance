import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const PUBLIC_ROUTES = ["/login", "/register", "/auth/callback"];

// Refresh window: only pay for a network token-validation/refresh when the
// access token is missing or within this many seconds of expiring.
const REFRESH_SKEW_SECONDS = 120;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  // Read the session from the cookie (no network). getUser() would round-trip to
  // the Auth server on *every* navigation and RSC prefetch — the main source of
  // page-to-page lag. Only hit the network when the token is actually stale.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const nowSec = Math.floor(Date.now() / 1000);
  const needsRefresh =
    !session || (session.expires_at ?? 0) - nowSec < REFRESH_SKEW_SECONDS;

  let hasUser = !!session;
  if (needsRefresh) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasUser = !!user;
  }

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((p) => pathname.startsWith(p));

  if (!hasUser && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasUser && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
