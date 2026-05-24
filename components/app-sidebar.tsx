"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Mic,
} from "lucide-react";

import { cn } from "@/lib/utils";

// Each nav item: where it goes, what to show, and an icon from lucide-react
const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
  { href: "/mock-interview", label: "Mock Interview", icon: Mic },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

/**
 * Left sidebar with links to every main section of the app.
 * "use client" is needed because we read the current URL to highlight the active link.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-zinc-900 text-zinc-100">
      {/* App title / branding at the top of the sidebar */}
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          AI Resume
        </p>
        <h1 className="text-lg font-semibold text-white">Platform</h1>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-300 hover:bg-zinc-800/60 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
