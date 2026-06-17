"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Menu, X } from "lucide-react";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    /*
     * FIX (Task 1): The wrapper previously had background: "#0f0f0f" which
     * bled into the content area on mobile (the dark sidebar background was
     * visible wherever the sidebar wasn't). Changed to white so the page
     * background is always correct on every screen size.
     */
    <div className="flex min-h-screen" style={{ background: "#ffffff" }}>

      {/* ── Mobile top bar ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "#0a0a0a", borderColor: "#1a1a1a" }}
      >
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <div
            className="flex items-center justify-center"
            style={{ width: "28px", height: "28px", background: "#fff", borderRadius: "7px" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <rect x="1" y="1" width="5" height="5" rx="1" fill="black" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="black" opacity="0.35" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="black" opacity="0.35" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="black" />
            </svg>
          </div>
          <span className="text-white font-bold tracking-tight" style={{ fontSize: "15px", letterSpacing: "-0.02em" }}>
            CareerLens
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1 rounded-md"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        className={`
          fixed top-0 left-0 h-full z-30 w-64 transition-transform duration-300
          lg:translate-x-0 lg:static lg:h-screen lg:shrink-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <AppSidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* ── Page content ── */}
      <main
        className="flex-1 overflow-auto min-w-0"
        style={{ paddingTop: "3.5rem" }}
      >
        {/*
         * FIX (Task 1): min-w-0 prevents flex children from overflowing.
         * The inline style below removes the top padding on desktop so the
         * sidebar top bar doesn't shift content down on large screens.
         */}
        <style>{`@media (min-width: 1024px) { main { padding-top: 0 !important; } }`}</style>
        {children}
      </main>
    </div>
  );
}