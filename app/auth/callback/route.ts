import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Pages that must never be used as a post-auth redirect destination */
const UNSAFE = new Set(["/login", "/auth/callback"]);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Validate next: must be a relative path, not login/callback
  const destination =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !UNSAFE.has(next)
      ? next
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=Could not sign in. Please try again.`
  );
}