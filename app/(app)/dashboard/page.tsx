import Link from "next/link";
import { FileText, Mic, BarChart3, ArrowRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AnalysisSummary } from "@/lib/database-types";
import { formatAnalysisDate, getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

async function getRecentAnalyses(): Promise<AnalysisSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, job_role, ats_score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) { console.error("[dashboard] fetch:", error); return []; }
  return (data ?? []) as AnalysisSummary[];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const analyses = user ? await getRecentAnalyses() : [];

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "there";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">

        {/* ── Welcome header ── */}
        <div className="mb-10">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.03em" }}>
            Welcome back, {displayName} 👋
          </h1>
          <p style={{ color: "#666", fontSize: "1rem", marginTop: "0.4rem" }}>
            Here's your career progress overview
          </p>
        </div>

        {/* ── Quick action cards ── */}
        <div className="grid gap-4 sm:grid-cols-3 mb-12">
          {ACTIONS.map((a) => (
            <ActionCard key={a.title} {...a} />
          ))}
        </div>

        {/* ── Recent analyses ── */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 style={{ fontWeight: 700, fontSize: "1.2rem", color: "#0a0a0a" }}>
              Recent Analyses
            </h2>
            <Link href="/resume-analyzer"
              className="flex items-center gap-1 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "#8B5CF6" }}>
              <Plus className="w-4 h-4" /> New analysis
            </Link>
          </div>

          {/* Empty state */}
          {analyses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center"
                 style={{ border: "2px dashed #e5e5e5" }}>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" style={{ color: "#999" }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0a0a0a", marginBottom: "0.4rem" }}>
                No analyses yet
              </h3>
              <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
                Upload your CV to get your first ATS score
              </p>
              <Link href="/resume-analyzer"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "#8B5CF6", color: "white" }}>
                Analyze my CV
              </Link>
            </div>
          )}

          {/* Analysis cards grid */}
          {analyses.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {analyses.map((a) => (
                <div key={a.id}
                  className="rounded-2xl p-5 transition-all hover:-translate-y-0.5"
                  style={{
                    border: "1px solid #ebebeb",
                    background: "white",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0a0a0a" }}>{a.job_role}</p>
                      <p style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.1rem" }}>
                        {formatAnalysisDate(a.created_at)}
                      </p>
                    </div>
                    <Badge className={cn("border text-xs", getScoreBadgeStyle(a.ats_score))}>
                      {getScoreLabel(a.ats_score)}
                    </Badge>
                  </div>
                  <p style={{ fontSize: "2.8rem", fontWeight: 900, color: "#0a0a0a", lineHeight: 1, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
                    {a.ats_score}
                    <span style={{ fontSize: "1.2rem", fontWeight: 600, color: "#999" }}>%</span>
                  </p>
                  <Link href={`/reports/${a.id}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold transition-all hover:bg-gray-100"
                    style={{ border: "1.5px solid #e5e5e5", color: "#0a0a0a" }}>
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

/* ── Action card ── */
function ActionCard({ href, icon: Icon, title, desc, accent }: {
  href: string; icon: React.ElementType;
  title: string; desc: string; accent: string;
}) {
  return (
    <Link href={href}
      className="group block rounded-2xl p-6 transition-all"
      style={{
        border: "1px solid #ebebeb",
        background: "white",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 30px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
      }}
    >
      <div className="mb-3 w-10 h-10 rounded-xl flex items-center justify-center"
           style={{ background: accent + "15" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: "1rem", color: "#0a0a0a", marginBottom: "0.3rem" }}>{title}</p>
      <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.5 }}>{desc}</p>
      <div className="mt-4 flex items-center gap-1 text-sm font-semibold transition-all"
           style={{ color: accent }}>
        Open <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

const ACTIONS = [
  {
    href: "/resume-analyzer",
    icon: FileText,
    title: "Resume Analyzer",
    desc: "Upload your CV and get an instant ATS score",
    accent: "#8B5CF6",
  },
  {
    href: "/mock-interview",
    icon: Mic,
    title: "Mock Interview",
    desc: "Practice with an AI interviewer for your role",
    accent: "#0a0a0a",
  },
  {
    href: "/reports",
    icon: BarChart3,
    title: "Reports",
    desc: "Review your past analyses and track progress",
    accent: "#8B5CF6",
  },
];