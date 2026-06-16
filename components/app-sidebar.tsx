"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, Mic, Settings } from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",       label: "Dashboard",       icon: LayoutDashboard },
  { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
  { href: "/mock-interview",  label: "Mock Interview",  icon: Mic },
  { href: "/reports",         label: "Reports",         icon: BarChart3 },
  { href: "/settings",        label: "Settings",        icon: Settings },
] as const;

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-sidebar
      className="flex h-full w-64 flex-col"
      style={{ background: "#0a0a0a", borderRight: "1px solid #1a1a1a" }}
    >
      {/* Logo — clicks to landing page */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 group"
        style={{
          borderBottom: "1px solid #1a1a1a",
          textDecoration: "none",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#111";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
        aria-label="CareerLens — go to home"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white"
             style={{ transition: "opacity 0.15s" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <rect x="1" y="1" width="5" height="5" rx="1" fill="black" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="black" opacity="0.35" />
            <rect x="1" y="8" width="5" height="5" rx="1" fill="black" opacity="0.35" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="black" />
          </svg>
        </div>
        <span
          className="font-bold tracking-tight text-white"
          style={{ fontSize: "15px", letterSpacing: "-0.02em", transition: "color 0.15s" }}
        >
          CareerLens
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive ? "text-black" : "text-zinc-500 hover:text-white"
              )}
              style={isActive ? { background: "white" } : undefined}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "#141414";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden
                    style={{ color: isActive ? "black" : "inherit" }} />
              {label}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-black" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Built-by credit */}
      <div className="px-4 py-3" style={{ borderTop: "1px solid #1a1a1a" }}>
        <a
          href="https://www.linkedin.com/in/rukha-manahil-798572340"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group w-full rounded-lg px-2 py-2 transition-all duration-150"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#141414"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "#1e1e1e", color: "#10B981", border: "1px solid #2a2a2a" }}
          >
            R
          </div>
          <div className="flex flex-col leading-tight">
            <span style={{ fontSize: "0.7rem", color: "#444", fontWeight: 500 }}>Built by</span>
            <span
              style={{ fontSize: "0.75rem", color: "#888", fontWeight: 600, transition: "color 0.15s ease" }}
              className="group-hover:!text-white"
            >
              Rukha Manahil
            </span>
          </div>
          <div className="ml-auto flex items-center">
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", display: "block", boxShadow: "0 0 0 2px #10B98122" }} />
          </div>
        </a>
      </div>

      <div style={{ borderTop: "1px solid #1a1a1a" }} />
      <div className="p-3"><AuthButton /></div>
    </aside>
  );
}