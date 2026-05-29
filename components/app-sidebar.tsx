"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Mic,
} from "lucide-react";
import { AuthButton } from "@/components/auth-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",                label: "Dashboard",       icon: LayoutDashboard },
  { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
  { href: "/mock-interview",  label: "Mock Interview",  icon: Mic },
  { href: "/reports",         label: "Reports",         icon: BarChart3 },
] as const;

interface AppSidebarProps {
  /** Called when a nav link is clicked — used by mobile layout to close the drawer */
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-sidebar
      className="flex h-full w-64 flex-col"
      style={{ background: "#0a0a0a", borderRight: "1px solid #1c1c1c" }}
    >
      {/* ── Logo / brand ── */}
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid #1c1c1c" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "white" }}
        >
          <span className="text-xs font-black text-black">AI</span>
        </div>
        <div>
          <p className="text-xs font-medium tracking-widest uppercase"
             style={{ color: "oklch(0.45 0 0)", lineHeight: 1 }}>
            Resume
          </p>
          <p className="font-bold text-white tracking-tight" style={{ lineHeight: 1.2 }}>
            Platform
          </p>
        </div>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-black"
                  : "text-zinc-400 hover:text-white"
              )}
              style={
                isActive
                  ? { background: "white" }
                  : undefined
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                aria-hidden
                style={{ color: isActive ? "black" : "inherit" }}
              />
              {label}

              {/* Active indicator dot */}
              {isActive && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: "black" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{ borderTop: "1px solid #1c1c1c" }} />

      {/* ── Auth button (sign out etc) ── */}
      <div className="p-3">
        <AuthButton />
      </div>
    </aside>
  );
}