import Link from "next/link";
import { FileText, ArrowRight, BarChart3 } from "lucide-react";
import type { AnalysisSummary } from "@/lib/database-types";
import { formatAnalysisDate, getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

async function getUserAnalyses(): Promise<AnalysisSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses").select("id, job_role, ats_score, created_at")
    .order("created_at", { ascending: false }).limit(20);
  if (error) { console.error("[reports] fetch:", error); return []; }
  return (data ?? []) as AnalysisSummary[];
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const analyses = user ? await getUserAnalyses() : [];

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      <div className="fixed top-0 left-64 pointer-events-none" style={{
        width: "600px", height: "400px",
        background: "radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)",
      }} />

      <div className="relative max-w-5xl mx-auto px-6 py-10 sm:px-10">

        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            Reports
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            Open a hiring readiness report from any saved analysis
          </p>
        </div>

        {/* Empty — no analyses */}
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
            <Link href="/resume-analyzer"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#7C3AED", color: "white" }}>
              Go to Resume Analyzer
            </Link>
          </div>
        )}

        {/* Analysis cards grid */}
        {analyses.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analyses.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl p-5"
                style={{ background: "#141414", border: "1px solid #1e1e1e", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C3AED")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p style={{ fontWeight: 700, fontSize: "1rem", color: "white" }}>{a.job_role}</p>
                    <p style={{ fontSize: "0.8rem", color: "#555", marginTop: "0.1rem" }}>
                      {formatAnalysisDate(a.created_at)}
                    </p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", getScoreBadgeStyle(a.ats_score))}>
                    {getScoreLabel(a.ats_score)}
                  </span>
                </div>

                <p style={{ fontSize: "2.8rem", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
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