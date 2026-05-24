"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, LogOut } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

/**
 * Shows sign-in link or the user's email + sign-out button in the sidebar.
 */
export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    /**
     * Load the current user once, then listen for login/logout changes.
     */
    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      setIsLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Clear the Supabase session and send the user to the login page.
   */
  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="mx-4 mb-4 block rounded-lg bg-zinc-800 px-3 py-2 text-center text-sm font-medium text-white hover:bg-zinc-700"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="mt-auto border-t border-zinc-800 p-4">
      <p className="mb-2 truncate text-xs text-zinc-400">
        {user.email ?? "Signed in"}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
      >
        {isSigningOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        Sign out
      </Button>
    </div>
  );
}
