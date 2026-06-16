"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3, ArrowRight, FileText, TrendingUp, Target,
  Award, Briefcase, X, CheckCircle2, AlertCircle,
  Lightbulb, MessageSquare, ChevronRight, Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AnalysisRow } from "@/lib/database-types";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type FilterKey = "all" | "high" | "needs" | "month";

/* ─────────────────────────────────────────────
   Helpers — read from full_analysis JSON
───────────────────────────────────────────── */
function getMissingSkills(row: AnalysisRow): string[] {
  return (row.full_analysis?.missingSkills ?? []).map((s) => s.name);
}

function getImprovements(row: AnalysisRow): string[] {
  return (row.full_analysis?.improvements ?? []).map((s) => s.suggestion);
}

function getInterviewQuestions(row: AnalysisRow): string[] {
  return (row.full_analysis?.interviewQuestions ?? []).map((q) => q.question);
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 50) return "Fair";
  return "Needs Work";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

/* ─────────────────────────────────────────────
   Circular Score Arc
───────────────────────────────────────────── */
function ScoreArc({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = getScoreColor(score);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
        fill="#111111" fontSize="15" fontWeight="800" letterSpacing="-0.5">
        {score}%
      </text>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-4">
          <div className="h-4 rounded-md mb-2" style={{ background: "#F3F4F6", width: "65%" }} />
          <div className="h-3 rounded-md"      style={{ background: "#F3F4F6", width: "40%" }} />
        </div>
        <div className="w-[88px] h-[88px] rounded-full" style={{ background: "#F3F4F6" }} />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-6 w-16 rounded-full" style={{ background: "#F3F4F6" }} />
        <div className="h-6 w-20 rounded-full" style={{ background: "#F3F4F6" }} />
      </div>
      <div className="h-9 rounded-xl" style={{ background: "#F3F4F6" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
function StatCard({ icon, value, label, color, delay }: {
  icon: React.ReactNode; value: string | number;
  label: string; color: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "20px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.2s ease", cursor: "default" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: color + "12" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <p style={{ fontSize: "2rem", fontWeight: 800, color: "#111111", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "4px" }}>{value}</p>
      <p style={{ fontSize: "0.8rem", color: "#6B7280", fontWeight: 500 }}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Report Card
───────────────────────────────────────────── */
function ReportCard({ analysis: a, index, onViewDetails }: {
  analysis: AnalysisRow; index: number; onViewDetails: (a: AnalysisRow) => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100 + index * 60); return () => clearTimeout(t); }, [index]);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "20px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.45s ease, transform 0.45s ease, box-shadow 0.2s ease, border-color 0.2s ease" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.07)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#D1D5DB"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: "#6B7280" }} />
            <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.job_role}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" style={{ color: "#9CA3AF" }} />
            <p style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>{formatDate(a.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "3px 10px", borderRadius: "999px", background: getScoreColor(a.ats_score) + "14", color: getScoreColor(a.ats_score), border: `1px solid ${getScoreColor(a.ats_score)}30` }}>
              ATS: {getScoreLabel(a.ats_score)}
            </span>
          </div>
        </div>
        <ScoreArc score={a.ats_score} />
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={() => onViewDetails(a)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs"
          style={{ background: "#F8F9FA", color: "#111111", border: "1px solid #E5E7EB", fontWeight: 600, cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#F8F9FA"; }}>
          <FileText className="w-3.5 h-3.5" /> Quick View
        </button>
        <Link href={`/reports/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ background: "#111111", color: "#FFFFFF" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#333333"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#111111"; }}>
          Full Report <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Detail Modal — reads from full_analysis
───────────────────────────────────────────── */
function DetailModal({ analysis: a, onClose }: { analysis: AnalysisRow; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const missingSkills      = getMissingSkills(a);
  const improvements       = getImprovements(a);
  const interviewQuestions = getInterviewQuestions(a);

  const sections = [
    { icon: <AlertCircle className="w-4 h-4" />,    color: "#EF4444", title: "Missing Skills",         items: missingSkills,      empty: "No missing skills identified." },
    { icon: <Lightbulb   className="w-4 h-4" />,    color: "#F59E0B", title: "Resume Improvements",    items: improvements,       empty: "No improvements suggested."    },
    { icon: <MessageSquare className="w-4 h-4" />,  color: "#10B981", title: "AI Interview Questions", items: interviewQuestions, empty: "No interview questions generated." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Analysis Report</p>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#111111", letterSpacing: "-0.02em" }}>{a.job_role}</h2>
            <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "2px" }}>{formatDate(a.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "#F3F4F6", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#E5E7EB")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6")}>
            <X className="w-4 h-4" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Score row */}
        <div className="grid grid-cols-1" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="flex flex-col items-center py-5" style={{ background: "#FFFFFF" }}>
            <p style={{ fontSize: "2rem", fontWeight: 900, color: getScoreColor(a.ats_score), letterSpacing: "-0.04em", lineHeight: 1 }}>{a.ats_score}%</p>
            <p style={{ fontSize: "0.72rem", color: "#9CA3AF", marginTop: "4px", fontWeight: 500 }}>ATS Score</p>
          </div>
        </div>

        {/* Sections */}
        <div className="p-6 flex flex-col gap-6">
          {sections.map((sec) => (
            <div key={sec.title}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: sec.color }}>{sec.icon}</span>
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111111" }}>{sec.title}</p>
              </div>
              {sec.items.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {sec.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#374151" }}>
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: sec.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.82rem", color: "#9CA3AF" }}>{sec.empty}</p>
              )}
            </div>
          ))}
          <Link href={`/reports/${a.id}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
            style={{ background: "#111111", color: "#FFFFFF" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#333333")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#111111")}
            onClick={onClose}>
            Open Full Report <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ReportsPage() {
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterKey>("all");
  const [modalData, setModalData] = useState<AnalysisRow | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const { data } = await supabase
        .from("analyses")
        .select("id, user_id, cv_text, job_role, ats_score, created_at, full_analysis")
        .order("created_at", { ascending: false })
        .limit(20);
      setAnalyses((data ?? []) as AnalysisRow[]);
      setLoading(false);
    }
    void load();
  }, []);

  const scores = analyses.map((a) => a.ats_score);

  const stats = {
    total:   analyses.length,
    highest: scores.length ? Math.max(...scores) : 0,
    avgAts:  avg(scores),
  };

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    switch (filter) {
      case "high":  return analyses.filter((a) => a.ats_score >= 70);
      case "needs": return analyses.filter((a) => a.ats_score < 50);
      case "month": return analyses.filter((a) => new Date(a.created_at) >= startOfMonth);
      default:      return analyses;
    }
  }, [analyses, filter]);

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 60); return () => clearTimeout(t); }, []);

  const filterPills: { key: FilterKey; label: string }[] = [
    { key: "all",   label: "All" },
    { key: "high",  label: "High ATS" },
    { key: "needs", label: "Needs Improvement" },
    { key: "month", label: "This Month" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FA" }}>
      {modalData && <DetailModal analysis={modalData} onClose={() => setModalData(null)} />}

      <div className="max-w-5xl mx-auto px-6 py-12 sm:px-10">

        {/* Hero */}
        <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.55s ease, transform 0.55s ease", marginBottom: "40px" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#111111" }}>
              <BarChart3 className="w-4 h-4" style={{ color: "#FFFFFF" }} />
            </div>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>Reports</span>
          </div>
          <h1 style={{ fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 900, color: "#111111", letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "10px" }}>Your Career Journey</h1>
          <p style={{ color: "#6B7280", fontSize: "1rem", maxWidth: "440px", lineHeight: 1.6 }}>Track every resume analysis and measure your progress over time.</p>
        </div>

        {/* Stat Cards */}
        {!loading && analyses.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-10" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
            <StatCard icon={<FileText className="w-4 h-4" />}   value={stats.total}           label="Total Analyses"     color="#111111" delay={120} />
            <StatCard icon={<Award className="w-4 h-4" />}      value={`${stats.highest}%`}   label="Highest ATS Score"  color="#10B981" delay={200} />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} value={`${stats.avgAts}%`}    label="Average ATS Score"  color="#F59E0B" delay={280} />
            <StatCard icon={<Target className="w-4 h-4" />}     value={stats.total}           label="Analyses Saved"     color="#111111" delay={360} />
          </div>
        )}

        {/* Filter Pills */}
        {!loading && analyses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filterPills.map((p) => {
              const active = filter === p.key;
              return (
                <button key={p.key} onClick={() => setFilter(p.key)}
                  style={{ padding: "6px 14px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, border: active ? "1px solid #111111" : "1px solid #E5E7EB", background: active ? "#111111" : "#FFFFFF", color: active ? "#FFFFFF" : "#6B7280", cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6"; (e.currentTarget as HTMLButtonElement).style.color = "#111111"; } }}
                  onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; } }}>
                  {p.label}
                </button>
              );
            })}
            <span style={{ fontSize: "0.75rem", color: "#9CA3AF", alignSelf: "center", marginLeft: "4px" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty State */}
        {!loading && analyses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl text-center" style={{ border: "2px dashed #E5E7EB", background: "#FFFFFF" }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "#F3F4F6" }}>
              <BarChart3 className="w-6 h-6" style={{ color: "#9CA3AF" }} />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: "1.15rem", color: "#111111", marginBottom: "8px", letterSpacing: "-0.02em" }}>No analyses yet</h3>
            <p style={{ color: "#6B7280", fontSize: "0.88rem", marginBottom: "24px", maxWidth: "300px", lineHeight: 1.6 }}>
              Upload your first resume and start tracking your career progress.
            </p>
            <Link href="/resume-analyzer" className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#111111", color: "#FFFFFF" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#333333")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#111111")}>
              Analyze Resume <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* No filter results */}
        {!loading && analyses.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl text-center" style={{ border: "1px solid #E5E7EB", background: "#FFFFFF" }}>
            <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: "#D1D5DB" }} />
            <p style={{ fontWeight: 700, color: "#111111", marginBottom: "4px" }}>No matches</p>
            <p style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>Try a different filter.</p>
          </div>
        )}

        {/* Report Cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.map((a, i) => (
              <ReportCard key={a.id} analysis={a} index={i} onViewDetails={setModalData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}