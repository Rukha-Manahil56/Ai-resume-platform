"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Menu, X } from "lucide-react";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
            <span className="text-black font-black text-xs">AI</span>
          </div>
          <span className="text-white font-bold tracking-tight">ResumeIQ</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1 rounded-md"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      {/* On mobile: slide in from left as a drawer. On desktop: always visible. */}
      <div
        className={`
          fixed top-0 left-0 h-full z-30 w-64 transition-transform duration-300
          lg:translate-x-0 lg:static lg:h-screen
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <AppSidebar />
      </div>

      {/* ── Main content ── */}
      <main
        className="flex-1 overflow-auto bg-white text-zinc-900 lg:ml-0"
        style={{ paddingTop: "3.5rem" }}  /* offset for mobile top bar */
      >
        {/* Remove the top padding on desktop */}
        <style>{`@media (min-width: 1024px) { main { padding-top: 0; } }`}</style>
        {children}
      </main>

    </div>
  );
}