"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

/**
 * Login form with Google OAuth (rendered inside Suspense for useSearchParams).
 */
export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const urlError = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);

  /**
   * Start Google OAuth — Supabase handles the redirect to Google and back.
   */
  async function handleGoogleSignIn() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            Sign in with Google to use the resume analyzer, mock interview, and
            reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => void handleGoogleSignIn()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>
          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
