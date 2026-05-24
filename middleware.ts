import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every matched request before the page loads.
 * Keeps Supabase auth cookies fresh and guards protected routes.
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes except static files and images.
     * This lets middleware refresh auth on API routes too.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
