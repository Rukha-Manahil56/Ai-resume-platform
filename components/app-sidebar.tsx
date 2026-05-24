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
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
  { href: "/mock-interview", label: "Mock Interview", icon: Mic },
  { href: "/reports", label: "Reports", icon: BarChart3 },
] as const;

/**
 * Left sidebar with navigation links and sign-in / sign-out controls.
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-sidebar
      className="flex w-64 shrink-0 flex-col bg-zinc-900 text-zinc-100"
    >
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
          AI Resume
        </p>
        <h1 className="text-lg font-semibold text-white">Platform</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

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

      <AuthButton />
    </aside>
  );
}
