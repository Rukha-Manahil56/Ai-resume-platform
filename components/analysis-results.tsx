"use client";

import Link from "next/link";
import { useState } from "react";
import { FileBarChart, ArrowRight } from "lucide-react";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import { getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { cn } from "@/lib/utils";

const TABS = ["overview", "skills", "improvements", "interview"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview:     "Overview",
  skills:       "Missing Skills",
  improvements: "Improvements",
  interview:    "Interview Prep",
};

interface Props {
  result: CvAnalysisResult;
  savedAnalysisId: string | null;
  saveWarning: string | null;
}

export function AnalysisResults({ result, savedAnalysisId, saveWarning }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const card: React.CSSProperties = {
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "0.75rem",
  };

  return (
    <div
      className="p-5"
      style={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: "1rem" }}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: "1.2rem", color: "white" }}>
            Analysis Results
          </h2>
          <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Powered by Gemini AI
          </p>
        </div>
        {savedAnalysisId ? (
          <Link
            href={`/reports/${savedAnalysisId}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#7C3AED", color: "white" }}
          >
            <FileBarChart className="w-4 h-4" /> Generate Report
          </Link>
        ) : (
          <p style={{ fontSize: "0.8rem", color: "#555" }}>Sign in to save reports</p>
        )}
      </div>

      {/* Save warning */}
      {saveWarning && (
        <div className="mb-4 rounded-xl px-4 py-3 text-sm"
             style={{ background: "#1a1500", border: "1px solid #3a2e00", color: "#fbbf24" }}>
          {saveWarning}
        </div>
      )}

      {/* Tab buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeTab === t ? "#7C3AED" : "#1a1a1a",
              color:      activeTab === t ? "white"    : "#777",
              border:     `1px solid ${activeTab === t ? "#7C3AED" : "#2a2a2a"}`,
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <p style={{
              fontSize: "5rem", fontWeight: 900, color: "white",
              lineHeight: 1, letterSpacing: "-0.04em",
            }}>
              {Math.round(result.atsScore)}
            </p>
            <div className="mb-2 flex flex-col gap-2">
              <span style={{ fontSize: "0.8rem", color: "#666" }}>ATS Score</span>
              <span className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium",
                getScoreBadgeStyle(result.atsScore)
              )}>
                {getScoreLabel(result.atsScore)}
              </span>
            </div>
          </div>
          <p style={{ color: "#888", lineHeight: 1.7, fontSize: "0.95rem" }}>
            {result.explanation}
          </p>
        </div>
      )}

      {/* ── Missing Skills ── */}
      {activeTab === "skills" && (
        <div className="space-y-3">
          {result.missingSkills.length === 0 ? (
            <p style={{ color: "#666" }}>No major skill gaps identified.</p>
          ) : (
            result.missingSkills.map((skill) => (
              <div
                key={skill.name}
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={card}
              >
                <span style={{ fontWeight: 600, color: "white" }}>{skill.name}</span>
                <span className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  skill.importance === "high"   && "border-red-800 bg-red-950 text-red-400",
                  skill.importance === "medium" && "border-yellow-800 bg-yellow-950 text-yellow-400",
                  skill.importance === "low"    && "border-zinc-700 bg-zinc-900 text-zinc-400",
                )}>
                  {skill.importance}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Improvements ── */}
      {activeTab === "improvements" && (
        <div className="space-y-4">
          {result.improvements.map((item, i) => (
            <div key={i} className="rounded-xl p-4 space-y-3" style={card}>
              <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>
                {item.suggestion}
              </p>
              <div className="rounded-lg p-3"
                   style={{ background: "#1a0000", border: "1px solid #3a0000" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f87171", marginBottom: "0.25rem" }}>
                  BEFORE
                </p>
                <p style={{ fontSize: "0.85rem", color: "#fca5a5" }}>{item.before}</p>
              </div>
              <div className="rounded-lg p-3"
                   style={{ background: "#001a00", border: "1px solid #003a00" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4ade80", marginBottom: "0.25rem" }}>
                  AFTER
                </p>
                <p style={{ fontSize: "0.85rem", color: "#86efac" }}>{item.after}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interview Prep ── */}
      {activeTab === "interview" && (
        <div className="space-y-4">
          {result.interviewQuestions.map((item, i) => (
            <div key={i} className="rounded-xl p-4" style={card}>
              <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                Q{i + 1}. {item.question}
              </p>
              <p style={{ fontSize: "0.85rem", color: "#888", lineHeight: 1.6 }}>
                <span style={{ color: "#7C3AED", fontWeight: 600 }}>Model answer: </span>
                {item.modelAnswer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}