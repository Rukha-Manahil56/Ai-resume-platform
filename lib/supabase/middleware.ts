import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Routes that require a signed-in user */
export const PROTECTED_PATHS = [
  "/resume-analyzer",
  "/mock-interview",
  "/reports",
] as const;

/**
 * Refresh the Supabase session and redirect unauthenticated users
 * away from protected pages.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Important: use getUser() — validates the JWT with Supabase (not just getSession())
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in users should not see the login page
  if (pathname === "/login" && user) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirect") ?? "/";
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = redirectTo;
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}
