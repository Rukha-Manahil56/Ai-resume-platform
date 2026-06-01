"use client";

import { useEffect, useState } from "react";
import { Loader2, User, Mail, Shield, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [user, setUser]       = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);
      setLoading(false);
    }
    void load();
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ?? "User";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const section: React.CSSProperties = {
    background: "#141414",
    border: "1px solid #1e1e1e",
    borderRadius: "1rem",
    padding: "1.5rem",
    marginBottom: "1rem",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center"
           style={{ background: "#0f0f0f" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
               style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      <div className="relative max-w-2xl mx-auto px-6 py-10 sm:px-10">

        {/* Header */}
        <div className="mb-8">
          <h1 style={{
            fontSize: "clamp(1.8rem,4vw,2.4rem)",
            fontWeight: 800, color: "white", letterSpacing: "-0.03em",
          }}>
            Settings
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            Manage your account preferences
          </p>
        </div>

        {/* Profile section */}
        <div style={section}>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-4 h-4" style={{ color: "#7C3AED" }} />
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>Profile</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
              style={{ background: "#7C3AED20", color: "#7C3AED", border: "1px solid #7C3AED30" }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: "1rem", color: "white" }}>
                {displayName}
              </p>
              <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.15rem" }}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Account section */}
        <div style={section}>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-4 h-4" style={{ color: "#7C3AED" }} />
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>Account</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
                 style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
              <span style={{ fontSize: "0.9rem", color: "#aaa" }}>Email address</span>
              <span style={{ fontSize: "0.9rem", color: "white", fontWeight: 500 }}>
                {user?.email}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
                 style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
              <span style={{ fontSize: "0.9rem", color: "#aaa" }}>Account type</span>
              <span className="rounded-full px-3 py-0.5 text-xs font-semibold"
                    style={{ background: "#7C3AED20", color: "#7C3AED", border: "1px solid #7C3AED30" }}>
                Free plan
              </span>
            </div>
          </div>
        </div>

        {/* Security section */}
        <div style={section}>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-4 h-4" style={{ color: "#7C3AED" }} />
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>Security</h2>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#7C3AED";
              (e.currentTarget as HTMLElement).style.color = "white";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
              (e.currentTarget as HTMLElement).style.color = "#aaa";
            }}
          >
            {signingOut
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            {signingOut ? "Signing out…" : "Sign out of all devices"}
          </button>
        </div>

      </div>
    </div>
  );
}