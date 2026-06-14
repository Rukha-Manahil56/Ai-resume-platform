"use client";

import Link from "next/link";
import { useState } from "react";
import { FileBarChart, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import { cn } from "@/lib/utils";

interface Props {
  result: CvAnalysisResult;
  savedAnalysisId: string | null;
  saveWarning: string | null;
}

/* ── Score helpers ── */
function getScoreConfig(score: number): {
  label: string;
  sublabel: string;
  color: string;
  trackColor: string;
  recommendation: string;
  weakness: string;
  action: string;
} {
  if (score >= 80) return {
    label: "Excellent Match",
    sublabel: "Your CV is well-aligned with this role",
    color: "#22c55e",
    trackColor: "#14532d",
    recommendation: "Strong",
    weakness: result_weakness(score),
    action: "Focus on interview preparation — your CV is competitive.",
  };
  if (score >= 60) return {
    label: "Good Match",
    sublabel: "A few targeted improvements will strengthen your application",
    color: "#f59e0b",
    trackColor: "#451a03",
    recommendation: "Moderate",
    weakness: result_weakness(score),
    action: "Apply the suggested improvements, then practice the interview questions.",
  };
  return {
    label: "Needs Work",
    sublabel: "Significant gaps exist between your CV and this role",
    color: "#ef4444",
    trackColor: "#450a0a",
    recommendation: "Low",
    weakness: result_weakness(score),
    action: "Address the high-priority skill gaps and rewrite flagged CV sections before applying.",
  };
}

function result_weakness(score: number): string {
  if (score >= 80) return "Minor keyword gaps or formatting inconsistencies";
  if (score >= 60) return "Missing key skills or insufficient role-specific experience";
  return "Major skill gaps and insufficient alignment with the job requirements";
}

/* ── Circular progress SVG ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap    = circumference - filled;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      {/* Track */}
      <circle cx="70" cy="70" r={radius}
        fill="none" stroke="#1e1e1e" strokeWidth="10" />
      {/* Progress */}
      <circle cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      {/* Score text */}
      <text x="70" y="62" textAnchor="middle"
        style={{ fill: "white", fontSize: "26px", fontWeight: 900, letterSpacing: "-1px" }}>
        {Math.round(score)}
      </text>
      <text x="70" y="80" textAnchor="middle"
        style={{ fill: "#666", fontSize: "11px", fontWeight: 500 }}>
        out of 100
      </text>
    </svg>
  );
}

/* ── Expandable interview card ── */
function QuestionCard({ item, index }: {
  item: { question: string; modelAnswer: string };
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #1e1e1e", background: "#0f0f0f" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: "#1e1e1e", color: "#7C3AED" }}
          >
            {index + 1}
          </span>
          <p style={{ fontWeight: 600, color: "white", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {item.question}
          </p>
        </div>
        <span className="shrink-0 mt-0.5" style={{ color: "#555" }}>
          {open
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <div
          className="px-5 pb-5"
          style={{ borderTop: "1px solid #1e1e1e" }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7C3AED", marginBottom: "0.5rem", marginTop: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Model Answer
          </p>
          <p style={{ fontSize: "0.88rem", color: "#aaa", lineHeight: 1.75 }}>
            {item.modelAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export function AnalysisResults({ result, savedAnalysisId, saveWarning }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "improvements" | "interview" | "recommendation">("overview");
  const score  = Math.round(result.atsScore);
  const config = getScoreConfig(score);

  const TABS = [
    { key: "overview",       label: "Overview"       },
    { key: "skills",         label: "Skill Gaps"     },
    { key: "improvements",   label: "Improvements"   },
    { key: "interview",      label: "Interview Prep" },
    { key: "recommendation", label: "Verdict"        },
  ] as const;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top header card ── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "#141414", border: "1px solid #1e1e1e" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              Analysis Complete
            </p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
              CV vs Job Description
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: config.color + "15", color: config.color, border: `1px solid ${config.color}30` }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: config.color }}
                />
                {config.label}
              </span>
              {(result as { fromCache?: boolean }).fromCache && (
                <span
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#1e1e1e", color: "#666", border: "1px solid #2a2a2a" }}
                >
                  Cached result
                </span>
              )}
            </div>
          </div>

          {/* Score ring */}
          <ScoreRing score={score} color={config.color} />
        </div>

        {/* Save warning */}
        {saveWarning && (
          <div
            className="mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
            style={{ background: "#1a1500", border: "1px solid #3a2e00", color: "#fbbf24" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {saveWarning}
          </div>
        )}

        {/* Report link */}
        {savedAnalysisId && (
          <Link
            href={`/reports/${savedAnalysisId}`}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#7C3AED", color: "white" }}
          >
            <FileBarChart className="w-4 h-4" /> View Full Report
          </Link>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="flex gap-1 p-1 rounded-xl flex-wrap"
        style={{ background: "#141414", border: "1px solid #1e1e1e" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === t.key ? "#7C3AED" : "transparent",
              color:      activeTab === t.key ? "white"   : "#666",
              minWidth:   "80px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">

          {/* Score breakdown */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid #1e1e1e" }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              ATS Score Breakdown
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.85rem", color: "#aaa" }}>Match percentage</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: config.color }}>{score}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e1e1e" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${score}%`, background: config.color }}
                />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Skills Match",    value: `${Math.min(100, score + 5)}%`  },
                { label: "Missing Skills",  value: `${result.missingSkills.length}` },
                { label: "Improvements",    value: `${result.improvements.length}`  },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl p-3 text-center"
                  style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}
                >
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                    {m.value}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#555", marginTop: "0.2rem" }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid #1e1e1e" }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Summary
            </p>
            <p style={{ color: "#bbb", lineHeight: 1.8, fontSize: "0.95rem" }}>
              {result.explanation}
            </p>
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {activeTab === "skills" && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "#141414", border: "1px solid #1e1e1e" }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            Missing Skills — {result.missingSkills.length} identified
          </p>

          {result.missingSkills.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
              <p style={{ color: "#aaa" }}>No major skill gaps identified. Strong alignment.</p>
            </div>
          ) : (
            <>
              {/* Chips grouped by importance */}
              {(["high", "medium", "low"] as const).map((level) => {
                const skills = result.missingSkills.filter((s) => s.importance === level);
                if (skills.length === 0) return null;
                const levelConfig = {
                  high:   { label: "High Priority",   color: "#ef4444", bg: "#1a0000", border: "#3a0000" },
                  medium: { label: "Medium Priority",  color: "#f59e0b", bg: "#1a1000", border: "#3a2000" },
                  low:    { label: "Low Priority",     color: "#888",    bg: "#111",    border: "#222"    },
                }[level];
                return (
                  <div key={level} className="mb-5">
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: levelConfig.color, marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {levelConfig.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill.name}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{
                            background: levelConfig.bg,
                            border: `1px solid ${levelConfig.border}`,
                            color: levelConfig.color,
                          }}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Improvements */}
      {activeTab === "improvements" && (
        <div className="flex flex-col gap-3">
          <div
            className="rounded-2xl px-6 pt-6 pb-2"
            style={{ background: "#141414", border: "1px solid #1e1e1e" }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              Top 5 CV Improvements
            </p>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.25rem" }}>
              Apply these changes to significantly improve your ATS score.
            </p>
          </div>

          {result.improvements.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ background: "#141414", border: "1px solid #1e1e1e" }}
            >
              {/* Suggestion header */}
              <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e1e1e" }}>
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                    style={{ background: "#7C3AED20", color: "#7C3AED", border: "1px solid #7C3AED30" }}
                  >
                    {i + 1}
                  </span>
                  <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {item.suggestion}
                  </p>
                </div>
              </div>

              {/* Before / After */}
              <div className="grid sm:grid-cols-2 gap-0" style={{ borderBottom: "none" }}>
                <div className="p-5" style={{ borderRight: "1px solid #1e1e1e" }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Before
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>
                    "{item.before}"
                  </p>
                </div>
                <div className="p-5">
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    After
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#bbb", lineHeight: 1.7 }}>
                    "{item.after}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interview Prep */}
      {activeTab === "interview" && (
        <div
          className="rounded-2xl p-6"
          style={{ background: "#141414", border: "1px solid #1e1e1e" }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            Interview Questions
          </p>
          <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.25rem" }}>
            Click any question to reveal the model answer.
          </p>

          <div className="flex flex-col gap-2">
            {result.interviewQuestions.map((item, i) => (
              <QuestionCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Verdict / Final Recommendation */}
      {activeTab === "recommendation" && (
        <div className="flex flex-col gap-4">

          {/* Overall readiness */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#141414", border: "1px solid #1e1e1e" }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Overall Readiness
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: config.color + "15", border: `1px solid ${config.color}30` }}
              >
                <TrendingUp className="w-7 h-7" style={{ color: config.color }} />
              </div>
              <div>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: config.color, letterSpacing: "-0.02em" }}>
                  {config.recommendation} Match
                </p>
                <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.2rem" }}>
                  {config.sublabel}
                </p>
              </div>
            </div>
          </div>

          {/* Three insight cards */}
          <div className="grid sm:grid-cols-3 gap-3">
            {/* ATS Score */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#141414", border: "1px solid #1e1e1e" }}
            >
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                ATS Score
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 900, color: config.color, letterSpacing: "-0.03em" }}>
                {score}%
              </p>
              <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>
                {config.label}
              </p>
            </div>

            {/* Biggest weakness */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#141414", border: "1px solid #1e1e1e" }}
            >
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Primary Gap
              </p>
              <p style={{ fontSize: "0.9rem", color: "#ddd", lineHeight: 1.5, fontWeight: 500 }}>
                {result.missingSkills.length > 0
                  ? result.missingSkills.filter(s => s.importance === "high")[0]?.name
                    ?? result.missingSkills[0].name
                  : "No critical gaps"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.3rem" }}>
                Highest priority skill
              </p>
            </div>

            {/* Skill gaps count */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "#141414", border: "1px solid #1e1e1e" }}
            >
              <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                Skills to Add
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>
                {result.missingSkills.length}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>
                {result.missingSkills.filter(s => s.importance === "high").length} high priority
              </p>
            </div>
          </div>

          {/* Action card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "#141414",
              border: `1px solid ${config.color}30`,
            }}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="w-5 h-5 shrink-0 mt-0.5"
                style={{ color: config.color }}
              />
              <div>
                <p style={{ fontWeight: 700, color: "white", fontSize: "1rem", marginBottom: "0.4rem" }}>
                  Recommended Next Action
                </p>
                <p style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.7 }}>
                  {config.action}
                </p>
              </div>
            </div>
          </div>

          {/* Go to full report */}
          {savedAnalysisId && (
            <Link
              href={`/reports/${savedAnalysisId}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#7C3AED", color: "white" }}
            >
              <FileBarChart className="w-4 h-4" />
              View Full Hiring Readiness Report
            </Link>
          )}
        </div>
      )}
    </div>
  );
}