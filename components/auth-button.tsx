"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function AuthButton() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    }

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-3 rounded-xl"
           style={{ background: "#141414" }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "oklch(0.5 0 0)" }} />
        <span className="text-sm" style={{ color: "oklch(0.5 0 0)" }}>Loading…</span>
      </div>
    );
  }

  /* ── Not signed in ── */
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
        style={{ background: "white", color: "#0a0a0a" }}
      >
        Sign in
      </Link>
    );
  }

  /* ── Signed in ── */
  /* Get display name: prefer full_name from metadata, else email prefix */
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "User";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-2">
      {/* User info row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: "#141414" }}
      >
        {/* Avatar circle */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "white", color: "#0a0a0a" }}
        >
          {initials || <User className="w-3.5 h-3.5" />}
        </div>

        {/* Name + email */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ color: "white", lineHeight: 1.2 }}
          >
            {displayName}
          </p>
          <p
            className="truncate text-xs"
            style={{ color: "oklch(0.45 0 0)", lineHeight: 1.4 }}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* Sign out button */}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-sm font-medium transition-all disabled:opacity-50"
        style={{ background: "#1a1a1a", color: "oklch(0.6 0 0)" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#222";
          (e.currentTarget as HTMLElement).style.color = "white";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
          (e.currentTarget as HTMLElement).style.color = "oklch(0.6 0 0)";
        }}
      >
        {isSigningOut
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <LogOut className="w-4 h-4" />
        }
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}