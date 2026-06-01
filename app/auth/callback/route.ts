import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  /* Always resolve to /dashboard unless a valid protected path was requested */
  const safeDest =
    !next || next === "/" || next === "/login" ? "/dashboard" : next;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeDest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not sign in. Please try again.`);
}