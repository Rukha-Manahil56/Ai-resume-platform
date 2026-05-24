import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppSidebar } from "@/components/app-sidebar";

import "./globals.css";

// Load Google fonts and expose them as CSS variables for Tailwind
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Default <title> and description for every page (can override per page later)
export const metadata: Metadata = {
  title: "AI Resume Platform",
  description: "Analyze resumes, practice interviews, and track your progress",
};

/**
 * Root layout wraps EVERY page in the app.
 * Here we add the sidebar + main content shell that never unmounts when you navigate.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen font-sans">
        {/* Full-height row: dark sidebar | white main area */}
        <div className="flex min-h-screen">
          <AppSidebar />

          {/* Page content from app/page.tsx, app/resume-analyzer/page.tsx, etc. */}
          <main className="flex-1 overflow-auto bg-white text-zinc-900">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
