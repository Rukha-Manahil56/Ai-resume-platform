"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, ArrowRight, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Analysis {
  id: string;
  job_role: string;
  ats_score: number;
  created_at: string;
}

export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from("analyses")
        .select("id, job_role, ats_score, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnalyses(data ?? []);
      setLoading(false);
    }
    void load();
  }, []);

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
      <div className="flex min-h-screen items-center justify-center"
           style={{ background: "#0f0f0f" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 animate-spin"
               style={{ borderColor: "#7C3AED", borderTopColor: "transparent" }} />
          <p style={{ color: "#666", fontSize: "0.9rem" }}>Loading reports…</p>
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
      <div className="fixed top-0 left-64 pointer-events-none" style={{
        width: "600px", height: "400px",
        background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)",
      }} />

      <div className="relative max-w-5xl mx-auto px-6 py-10 sm:px-10">

        {/* Header */}
        <div className="mb-8">
          <h1 style={{
            fontSize: "clamp(1.8rem,4vw,2.4rem)",
            fontWeight: 800, color: "white", letterSpacing: "-0.03em",
          }}>
            Reports
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            View your hiring readiness reports from past analyses
          </p>
        </div>

        {/* Empty state */}
        {analyses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl text-center"
               style={{ border: "2px dashed #2a2a2a" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                 style={{ background: "#1a1a1a" }}>
              <BarChart3 className="w-6 h-6" style={{ color: "#555" }} />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "white", marginBottom: "0.4rem" }}>
              No reports yet
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
              Run a resume analysis first, then generate a report from the results
            </p>
            <Link
              href="/resume-analyzer"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#7C3AED", color: "white" }}
            >
              Go to Resume Analyzer
            </Link>
          </div>
        )}

        {/* Reports grid */}
        {analyses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl p-5"
                style={{
                  background: "#141414",
                  border: "1px solid #1e1e1e",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>
                      {a.job_role}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "0.1rem" }}>
                      {formatDate(a.created_at)}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: getScoreColor(a.ats_score) + "20",
                      color: getScoreColor(a.ats_score),
                      border: `1px solid ${getScoreColor(a.ats_score)}40`,
                    }}
                  >
                    {getScoreLabel(a.ats_score)}
                  </span>
                </div>

                <p style={{
                  fontSize: "2.8rem", fontWeight: 900, color: "white",
                  lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "1rem",
                }}>
                  {a.ats_score}
                  <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#555" }}>%</span>
                </p>

                <Link
                  href={`/reports/${a.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: "#7C3AED", color: "white" }}
                >
                  View Report <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}