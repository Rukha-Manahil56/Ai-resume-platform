"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Mic, BarChart3, ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Analysis {
  id: string;
  job_role: string;
  ats_score: number;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser]         = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u);

      if (u) {
        const { data } = await supabase
          .from("analyses")
          .select("id, job_role, ats_score, created_at")
          .order("created_at", { ascending: false })
          .limit(5);
        setAnalyses(data ?? []);
      }
      setLoading(false);
    }

    void load();
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "there";

  function getScoreColor(score: number) {
    if (score >= 70) return "#4ade80";
    if (score >= 50) return "#fbbf24";
    return "#f87171";
  }

  function getScoreLabel(score: number) {
    if (score >= 70) return "Strong";
    if (score >= 50) return "Fair";
    return "Weak";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#0f0f0f" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
               style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Loading your dashboard…</p>
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

      {/* Purple glow */}
      <div className="fixed top-0 right-0 pointer-events-none" style={{
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
      }} />

      <div className="relative mx-auto max-w-5xl px-6 py-10 sm:px-10">

        {/* Welcome */}
        <div className="mb-10">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            Welcome back, {displayName} 👋
          </h1>
          <p style={{ color: "#666", fontSize: "1rem", marginTop: "0.4rem" }}>
            Here's your career progress overview
          </p>
        </div>

        {/* Action cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {ACTIONS.map((a) => (
            <Link key={a.title} href={a.href}
              className="group block rounded-2xl p-6 transition-all"
              style={{ border: "1px solid #1e1e1e", background: "#141414" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = a.accent;
                (e.currentTarget as HTMLElement).style.background = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#1e1e1e";
                (e.currentTarget as HTMLElement).style.background = "#141414";
              }}
            >
              <div className="mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: a.accent + "20" }}>
                <a.icon className="w-5 h-5" style={{ color: a.accent }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: "1rem", color: "white", marginBottom: "0.3rem" }}>
                {a.title}
              </p>
              <p style={{ fontSize: "0.85rem", color: "#666", lineHeight: 1.5 }}>{a.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-semibold" style={{ color: a.accent }}>
                Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Recent analyses */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem", color: "white" }}>
              Recent Analyses
            </h2>
            <Link href="/resume-analyzer"
              className="flex items-center gap-1 text-sm font-semibold"
              style={{ color: "#7C3AED" }}>
              <Plus className="w-4 h-4" /> New analysis
            </Link>
          </div>

          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
                 style={{ border: "2px dashed #2a2a2a" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: "#1a1a1a" }}>
                <FileText className="w-6 h-6" style={{ color: "#555" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "white", marginBottom: "0.4rem" }}>
                No analyses yet
              </h3>
              <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
                Upload your CV to get your first ATS score
              </p>
              <Link href="/resume-analyzer"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#7C3AED", color: "white" }}>
                Analyze my CV
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analyses.map((a) => (
                <div key={a.id} className="rounded-2xl p-5"
                     style={{ background: "#141414", border: "1px solid #1e1e1e", transition: "border-color 0.2s" }}
                     onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
                     onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>{a.job_role}</p>
                      <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "0.1rem" }}>
                        {formatDate(a.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: getScoreColor(a.ats_score) + "20",
                            color: getScoreColor(a.ats_score),
                            border: `1px solid ${getScoreColor(a.ats_score)}40`,
                          }}>
                      {getScoreLabel(a.ats_score)}
                    </span>
                  </div>
                  <p style={{ fontSize: "2.8rem", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
                    {a.ats_score}
                    <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#555" }}>%</span>
                  </p>
                  <Link href={`/reports/${a.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{ border: "1.5px solid #2a2a2a", color: "#aaa" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#7C3AED";
                      (e.currentTarget as HTMLElement).style.color = "#7C3AED";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
                      (e.currentTarget as HTMLElement).style.color = "#aaa";
                    }}
                  >
                    View report <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ACTIONS = [
  { href: "/resume-analyzer", icon: FileText, title: "Resume Analyzer", desc: "Upload your CV and get an instant ATS score",      accent: "#7C3AED" },
  { href: "/mock-interview",  icon: Mic,      title: "Mock Interview",  desc: "Practice with an AI interviewer for your role",   accent: "#a78bfa" },
  { href: "/reports",         icon: BarChart3, title: "Reports",        desc: "Review your past analyses and track progress",     accent: "#7C3AED" },
];