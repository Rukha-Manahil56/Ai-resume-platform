"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Mic, BarChart3, ArrowRight, Plus, TrendingUp, CheckCircle2, Clock } from "lucide-react";
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

  function getScoreBadge(score: number): { label: string; color: string; bg: string; border: string } {
    if (score >= 70) return { label: "Strong",   color: "#2d7a4f", bg: "#f0faf4", border: "#c8ecd8" };
    if (score >= 50) return { label: "Fair",     color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
    return              { label: "Needs work", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  const latestScore    = analyses[0]?.ats_score ?? null;
  const totalAnalyses  = analyses.length;
  const avgScore       = totalAnalyses
    ? Math.round(analyses.reduce((s, a) => s + a.ats_score, 0) / totalAnalyses)
    : null;

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f9f9f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "28px", height: "28px",
              border: "2px solid #e0e0e0",
              borderTop: "2px solid #0a0a0a",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ fontSize: "13px", color: "#aaa" }}>Loading your dashboard…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9f9f9",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Welcome ── */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              fontSize: "11px", fontWeight: 600,
              letterSpacing: "0.08em", textTransform: "uppercase",
              color: "#aaa", marginBottom: "8px",
            }}
          >
            Dashboard
          </div>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 750,
              color: "#0a0a0a",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "8px",
            }}
          >
            Welcome back, {displayName}
          </h1>
          <p style={{ fontSize: "14px", color: "#888", lineHeight: 1.6 }}>
            Track your resume performance, interview readiness, and recent reports.
          </p>
        </div>

        {/* ── Metric cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "14px",
            marginBottom: "32px",
          }}
          className="metrics-grid"
        >
          {[
            {
              label: "Latest ATS score",
              value: latestScore !== null ? `${latestScore}%` : "—",
              sub: latestScore !== null
                ? latestScore >= 70 ? "Strong match" : latestScore >= 50 ? "Fair match" : "Needs work"
                : "No analysis yet",
              icon: TrendingUp,
            },
            {
              label: "Analyses completed",
              value: totalAnalyses > 0 ? String(totalAnalyses) : "0",
              sub: totalAnalyses === 1 ? "1 resume analyzed" : `${totalAnalyses} resumes analyzed`,
              icon: FileText,
            },
            {
              label: "Avg. ATS score",
              value: avgScore !== null ? `${avgScore}%` : "—",
              sub: "Across all analyses",
              icon: BarChart3,
            },
            {
              label: "Career readiness",
              value: avgScore !== null
                ? avgScore >= 70 ? "Good" : avgScore >= 50 ? "Fair" : "Early"
                : "—",
              sub: "Based on your scores",
              icon: CheckCircle2,
            },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: "#fff",
                border: "1px solid #e8e8e8",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                }}
              >
                <span style={{ fontSize: "12px", color: "#aaa", fontWeight: 500 }}>
                  {m.label}
                </span>
                <div
                  style={{
                    width: "28px", height: "28px",
                    background: "#f5f5f5",
                    border: "1px solid #eee",
                    borderRadius: "7px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <m.icon size={13} style={{ color: "#888" }} />
                </div>
              </div>
              <div
                style={{
                  fontSize: "1.7rem",
                  fontWeight: 750,
                  color: "#0a0a0a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  marginBottom: "6px",
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: "11.5px", color: "#bbb" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Two-column: quick actions + recent reports ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" }}
          className="main-grid"
        >

          {/* Quick actions */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #f0f0f0" }}>
              <p style={{ fontSize: "13px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                Quick actions
              </p>
            </div>
            <div style={{ padding: "8px" }}>
              {ACTIONS.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "11px 12px",
                    borderRadius: "9px",
                    textDecoration: "none",
                    transition: "background 0.15s",
                    marginBottom: "2px",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5f5f5")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  <div
                    style={{
                      width: "32px", height: "32px",
                      background: "#f5f5f5",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <a.icon size={14} style={{ color: "#555" }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 550, color: "#0a0a0a", lineHeight: 1.2 }}>
                      {a.title}
                    </p>
                    <p style={{ fontSize: "11.5px", color: "#aaa", lineHeight: 1.3, marginTop: "2px" }}>
                      {a.desc}
                    </p>
                  </div>
                  <ArrowRight size={13} style={{ color: "#ccc", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent analyses */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                Recent analyses
              </p>
              <Link
                href="/resume-analyzer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  fontSize: "12px", fontWeight: 550, color: "#555",
                  textDecoration: "none",
                  padding: "5px 10px",
                  background: "#f5f5f5",
                  border: "1px solid #eee",
                  borderRadius: "7px",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#ccc")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#eee")}
              >
                <Plus size={12} /> New analysis
              </Link>
            </div>

            {analyses.length === 0 ? (
              <div style={{ padding: "56px 20px", textAlign: "center" }}>
                <div
                  style={{
                    width: "40px", height: "40px",
                    background: "#f5f5f5",
                    border: "1px solid #eee",
                    borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 14px",
                  }}
                >
                  <FileText size={16} style={{ color: "#bbb" }} />
                </div>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#0a0a0a", marginBottom: "6px" }}>
                  No analyses yet
                </p>
                <p style={{ fontSize: "12.5px", color: "#aaa", marginBottom: "18px" }}>
                  Upload your CV to get your first ATS score
                </p>
                <Link
                  href="/resume-analyzer"
                  style={{
                    display: "inline-block",
                    background: "#0a0a0a",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 550,
                    padding: "9px 18px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  Analyze my resume
                </Link>
              </div>
            ) : (
              <div>
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px 120px 90px",
                    padding: "10px 20px",
                    borderBottom: "1px solid #f5f5f5",
                    background: "#fafafa",
                  }}
                >
                  {["Job role", "ATS score", "Date", "Status"].map((h) => (
                    <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "#bbb", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {analyses.map((a, i) => {
                  const badge = getScoreBadge(a.ats_score);
                  return (
                    <Link
                      key={a.id}
                      href={`/reports/${a.id}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 100px 120px 90px",
                        padding: "14px 20px",
                        borderBottom: i < analyses.length - 1 ? "1px solid #f5f5f5" : "none",
                        textDecoration: "none",
                        transition: "background 0.15s",
                        alignItems: "center",
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafafa")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                    >
                      {/* Role */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "28px", height: "28px", flexShrink: 0,
                            background: "#f5f5f5", border: "1px solid #eee",
                            borderRadius: "7px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          <FileText size={12} style={{ color: "#888" }} />
                        </div>
                        <span
                          style={{
                            fontSize: "13px", fontWeight: 550, color: "#0a0a0a",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}
                        >
                          {a.job_role}
                        </span>
                      </div>

                      {/* Score */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
                          {a.ats_score}
                        </span>
                        <span style={{ fontSize: "12px", color: "#bbb", fontWeight: 400 }}>%</span>
                      </div>

                      {/* Date */}
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Clock size={11} style={{ color: "#ccc" }} />
                        <span style={{ fontSize: "12px", color: "#aaa" }}>{formatDate(a.created_at)}</span>
                      </div>

                      {/* Badge */}
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "11px", fontWeight: 600,
                          color: badge.color,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          padding: "3px 9px",
                          borderRadius: "20px",
                          width: "fit-content",
                        }}
                      >
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}

                {/* Footer */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f5f5f5" }}>
                  <Link
                    href="/reports"
                    style={{
                      fontSize: "12.5px", fontWeight: 500, color: "#888",
                      textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: "4px",
                    }}
                  >
                    View all reports <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .metrics-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 420px) {
          .metrics-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const ACTIONS = [
  { href: "/resume-analyzer", icon: FileText,  title: "Analyze resume",      desc: "Upload CV, get ATS score"         },
  { href: "/mock-interview",  icon: Mic,        title: "Start mock interview", desc: "Practice for your target role"   },
  { href: "/reports",         icon: BarChart3,  title: "View reports",        desc: "Browse past analyses"             },
];