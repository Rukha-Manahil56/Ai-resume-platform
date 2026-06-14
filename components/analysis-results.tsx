"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileBarChart, ChevronDown, ChevronUp,
  CheckCircle2, TrendingUp, Download, Loader2,
} from "lucide-react";
import type { CvAnalysisResult } from "@/lib/analysis-types";

interface Props {
  result: CvAnalysisResult;
  savedAnalysisId: string | null;
  saveWarning: string | null;
  jobRole?: string;
}

/* ── Score helpers ── */
function getScoreConfig(score: number) {
  if (score >= 80) return {
    label: "Excellent Match",
    sublabel: "Your CV is well-aligned with this role",
    color: "#22c55e",
    recommendation: "Strong",
    action: "Focus on interview preparation — your CV is competitive.",
  };
  if (score >= 60) return {
    label: "Good Match",
    sublabel: "A few targeted improvements will strengthen your application",
    color: "#f59e0b",
    recommendation: "Moderate",
    action: "Apply the suggested improvements, then practice the interview questions.",
  };
  return {
    label: "Needs Work",
    sublabel: "Significant gaps exist between your CV and this role",
    color: "#ef4444",
    recommendation: "Low",
    action: "Address the high-priority skill gaps and rewrite flagged CV sections before applying.",
  };
}

/* ── Circular progress SVG ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e1e1e" strokeWidth="10" />
      <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="70" y="62" textAnchor="middle"
        style={{ fill: "white", fontSize: "26px", fontWeight: 900, letterSpacing: "-1px" }}>
        {score}
      </text>
      <text x="70" y="80" textAnchor="middle"
        style={{ fill: "#666", fontSize: "11px", fontWeight: 500 }}>
        out of 100
      </text>
    </svg>
  );
}

/* ── Expandable question card ── */
function QuestionCard({ item, index }: {
  item: { question: string; modelAnswer: string };
  index: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden"
         style={{ border: "1px solid #1e1e1e", background: "#0f0f0f" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: "#1e1e1e", color: "#7C3AED" }}>
            {index + 1}
          </span>
          <p style={{ fontWeight: 600, color: "white", fontSize: "0.9rem", lineHeight: 1.5 }}>
            {item.question}
          </p>
        </div>
        <span className="shrink-0 mt-0.5" style={{ color: "#555" }}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: "1px solid #1e1e1e" }}>
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

/* ── PDF generator ── */
async function generatePdfReport(
  result: CvAnalysisResult,
  jobRole: string,
  score: number,
  config: ReturnType<typeof getScoreConfig>
) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W   = 210;
  const MARGIN   = 18;
  const CONTENT  = PAGE_W - MARGIN * 2;
  const date     = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  let y = 0;

  /* ── helpers ── */
  function checkPage(needed = 10) {
    if (y + needed > 270) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function sectionTitle(text: string) {
    checkPage(14);
    y += 6;
    doc.setFillColor(240, 240, 240);
    doc.rect(MARGIN, y, CONTENT, 8, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(text.toUpperCase(), MARGIN + 3, y + 5.5);
    y += 12;
  }

  function bodyText(text: string, indent = 0, color: [number, number, number] = [80, 80, 80]) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT - indent);
    lines.forEach((line: string) => {
      checkPage(6);
      doc.text(line, MARGIN + indent, y);
      y += 5.5;
    });
  }

  function labelText(text: string) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text(text, MARGIN, y);
    y += 4.5;
  }

  function divider() {
    checkPage(6);
    y += 3;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + CONTENT, y);
    y += 4;
  }

  /* ══ HEADER ══ */
  y = MARGIN;

  /* App name */
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 10, 10);
  doc.text("ResumeIQ", MARGIN, y);

  /* Date top-right */
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(date, PAGE_W - MARGIN, y, { align: "right" });
  y += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text("AI-Powered Resume Analysis Report", MARGIN, y);
  y += 8;

  /* Thin rule under header */
  doc.setDrawColor(10, 10, 10);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + CONTENT, y);
  y += 8;

  /* ══ META ROW ══ */
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Target Role", MARGIN, y);
  doc.text("ATS Score", MARGIN + 90, y);
  doc.text("Verdict", MARGIN + 130, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(10, 10, 10);
  doc.text(jobRole || "Not specified", MARGIN, y);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${score}%`, MARGIN + 90, y);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(config.label, MARGIN + 130, y);
  y += 10;

  divider();

  /* ══ SECTION 1: EXPLANATION ══ */
  sectionTitle("1. Summary");
  bodyText(result.explanation);
  y += 2;

  /* ══ SECTION 2: MISSING SKILLS ══ */
  sectionTitle("2. Missing Skills");

  const highSkills   = result.missingSkills.filter((s) => s.importance === "high");
  const mediumSkills = result.missingSkills.filter((s) => s.importance === "medium");
  const lowSkills    = result.missingSkills.filter((s) => s.importance === "low");

  if (result.missingSkills.length === 0) {
    bodyText("No major skill gaps identified.");
  } else {
    if (highSkills.length > 0) {
      labelText("HIGH PRIORITY");
      bodyText(highSkills.map((s) => `• ${s.name}`).join("   "), 0, [180, 40, 40]);
      y += 2;
    }
    if (mediumSkills.length > 0) {
      labelText("MEDIUM PRIORITY");
      bodyText(mediumSkills.map((s) => `• ${s.name}`).join("   "), 0, [140, 100, 20]);
      y += 2;
    }
    if (lowSkills.length > 0) {
      labelText("LOW PRIORITY");
      bodyText(lowSkills.map((s) => `• ${s.name}`).join("   "), 0, [100, 100, 100]);
      y += 2;
    }
  }

  /* ══ SECTION 3: IMPROVEMENTS ══ */
  sectionTitle("3. Top 5 CV Improvements");

  result.improvements.forEach((item, i) => {
    checkPage(30);

    /* Suggestion */
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    const suggLines = doc.splitTextToSize(`${i + 1}. ${item.suggestion}`, CONTENT);
    suggLines.forEach((line: string) => {
      doc.text(line, MARGIN, y);
      y += 5;
    });

    /* Before */
    checkPage(10);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(160, 40, 40);
    doc.text("BEFORE", MARGIN + 3, y);
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 60, 60);
    const beforeLines = doc.splitTextToSize(`"${item.before}"`, CONTENT - 6);
    beforeLines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, MARGIN + 3, y);
      y += 4.5;
    });

    /* After */
    checkPage(10);
    y += 1;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 120, 60);
    doc.text("AFTER", MARGIN + 3, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 90, 50);
    const afterLines = doc.splitTextToSize(`"${item.after}"`, CONTENT - 6);
    afterLines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, MARGIN + 3, y);
      y += 4.5;
    });

    y += 4;
    /* Light separator between improvements */
    if (i < result.improvements.length - 1) {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y, MARGIN + CONTENT, y);
      y += 4;
    }
  });

  /* ══ SECTION 4: INTERVIEW QUESTIONS ══ */
  sectionTitle("4. Interview Questions & Model Answers");

  result.interviewQuestions.forEach((item, i) => {
    checkPage(20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    const qLines = doc.splitTextToSize(`Q${i + 1}. ${item.question}`, CONTENT);
    qLines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, MARGIN, y);
      y += 5;
    });

    checkPage(8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 60, 180);
    doc.text("Model Answer:", MARGIN + 3, y);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const aLines = doc.splitTextToSize(item.modelAnswer, CONTENT - 6);
    aLines.forEach((line: string) => {
      checkPage(5);
      doc.text(line, MARGIN + 3, y);
      y += 4.5;
    });

    y += 4;
  });

  /* ══ SECTION 5: FINAL RECOMMENDATION ══ */
  sectionTitle("5. Final Recommendation");

  /* Box */
  checkPage(40);
  doc.setFillColor(248, 248, 248);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT, 36, 2, 2, "FD");

  const innerY = y + 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Overall Readiness", MARGIN + 4, innerY);
  doc.text(`${config.recommendation} Match — ${score}%`, MARGIN + 50, innerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  const primaryGap = result.missingSkills.find((s) => s.importance === "high")?.name
    ?? result.missingSkills[0]?.name
    ?? "None identified";

  doc.text(`Primary gap:  ${primaryGap}`, MARGIN + 4, innerY + 8);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Next action:", MARGIN + 4, innerY + 16);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const actionLines = doc.splitTextToSize(config.action, CONTENT - 10);
  actionLines.forEach((line: string, idx: number) => {
    doc.text(line, MARGIN + 4, innerY + 22 + idx * 5);
  });

  y += 42;

  /* ══ FOOTER ══ */
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(
      `ResumeIQ  ·  Generated ${date}  ·  Page ${p} of ${totalPages}`,
      PAGE_W / 2,
      290,
      { align: "center" }
    );
  }

  /* ══ SAVE ══ */
  const fileName = `ResumeIQ_Report_${(jobRole || "Analysis").replace(/\s+/g, "_")}_${Date.now()}.pdf`;
  doc.save(fileName);
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function AnalysisResults({ result, savedAnalysisId, saveWarning, jobRole }: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "skills" | "improvements" | "interview" | "recommendation"
  >("overview");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const score  = Math.round(result.atsScore);
  const config = getScoreConfig(score);

  const TABS = [
    { key: "overview",       label: "Overview"       },
    { key: "skills",         label: "Skill Gaps"     },
    { key: "improvements",   label: "Improvements"   },
    { key: "interview",      label: "Interview Prep" },
    { key: "recommendation", label: "Verdict"        },
  ] as const;

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      await generatePdfReport(result, jobRole ?? "Not specified", score, config);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top header card ── */}
      <div className="rounded-2xl p-6"
           style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
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
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
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
          <ScoreRing score={score} color={config.color} />
        </div>

        {/* Action buttons row */}
        <div className="flex flex-wrap gap-3 mt-5">
          {/* Download PDF */}
          <button
            onClick={() => void handleDownloadPdf()}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "white" }}
          >
            {isGeneratingPdf
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
              : <><Download className="w-4 h-4" /> Download PDF Report</>
            }
          </button>

          {/* Full report link */}
          {savedAnalysisId && (
            <Link
              href={`/reports/${savedAnalysisId}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#7C3AED", color: "white" }}
            >
              <FileBarChart className="w-4 h-4" /> View Full Report
            </Link>
          )}
        </div>

        {saveWarning && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm"
               style={{ background: "#1a1500", border: "1px solid #3a2e00", color: "#fbbf24" }}>
            {saveWarning}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 rounded-xl flex-wrap"
           style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === t.key ? "#7C3AED" : "transparent",
              color:      activeTab === t.key ? "white"   : "#666",
              minWidth: "80px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              ATS Score Breakdown
            </p>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "0.85rem", color: "#aaa" }}>Match percentage</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: config.color }}>{score}%</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#1e1e1e" }}>
                <div className="h-full rounded-full transition-all duration-1000"
                     style={{ width: `${score}%`, background: config.color }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Skills Match",   value: `${Math.min(100, score + 5)}%`   },
                { label: "Missing Skills", value: `${result.missingSkills.length}` },
                { label: "Improvements",   value: `${result.improvements.length}`  },
              ].map((m) => (
                <div key={m.label} className="rounded-xl p-3 text-center"
                     style={{ background: "#0f0f0f", border: "1px solid #1e1e1e" }}>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                    {m.value}
                  </p>
                  <p style={{ fontSize: "0.72rem", color: "#555", marginTop: "0.2rem" }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
              Summary
            </p>
            <p style={{ color: "#bbb", lineHeight: 1.8, fontSize: "0.95rem" }}>{result.explanation}</p>
          </div>
        </div>
      )}

      {/* ── Skill Gaps ── */}
      {activeTab === "skills" && (
        <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1.25rem" }}>
            Missing Skills — {result.missingSkills.length} identified
          </p>
          {result.missingSkills.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="w-5 h-5" style={{ color: "#22c55e" }} />
              <p style={{ color: "#aaa" }}>No major skill gaps identified.</p>
            </div>
          ) : (
            (["high", "medium", "low"] as const).map((level) => {
              const skills = result.missingSkills.filter((s) => s.importance === level);
              if (!skills.length) return null;
              const cfg = {
                high:   { label: "High Priority",   color: "#ef4444", bg: "#1a0000", border: "#3a0000" },
                medium: { label: "Medium Priority",  color: "#f59e0b", bg: "#1a1000", border: "#3a2000" },
                low:    { label: "Low Priority",     color: "#888",    bg: "#111",    border: "#222"    },
              }[level];
              return (
                <div key={level} className="mb-5">
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: cfg.color, marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {cfg.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill.name} className="px-3 py-1.5 rounded-lg text-sm font-medium"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Improvements ── */}
      {activeTab === "improvements" && (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl px-6 pt-6 pb-2"
               style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
              Top 5 CV Improvements
            </p>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.25rem" }}>
              Apply these changes to significantly improve your ATS score.
            </p>
          </div>
          {result.improvements.map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
                 style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
              <div className="px-6 py-4" style={{ borderBottom: "1px solid #1e1e1e" }}>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{ background: "#7C3AED20", color: "#7C3AED", border: "1px solid #7C3AED30" }}>
                    {i + 1}
                  </span>
                  <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {item.suggestion}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-0">
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

      {/* ── Interview Prep ── */}
      {activeTab === "interview" && (
        <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
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

      {/* ── Verdict ── */}
      {activeTab === "recommendation" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6" style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>
              Overall Readiness
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                   style={{ background: config.color + "15", border: `1px solid ${config.color}30` }}>
                <TrendingUp className="w-7 h-7" style={{ color: config.color }} />
              </div>
              <div>
                <p style={{ fontSize: "1.4rem", fontWeight: 800, color: config.color, letterSpacing: "-0.02em" }}>
                  {config.recommendation} Match
                </p>
                <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.2rem" }}>{config.sublabel}</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { label: "ATS Score",    value: `${score}%`, sub: config.label },
              {
                label: "Primary Gap",
                value: result.missingSkills.find((s) => s.importance === "high")?.name
                  ?? result.missingSkills[0]?.name ?? "None",
                sub: "Highest priority skill",
              },
              {
                label: "Skills to Add",
                value: `${result.missingSkills.length}`,
                sub: `${result.missingSkills.filter((s) => s.importance === "high").length} high priority`,
              },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl p-5"
                   style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
                  {m.label}
                </p>
                <p style={{ fontSize: m.label === "Primary Gap" ? "0.95rem" : "2rem", fontWeight: 800, color: "white", letterSpacing: m.label === "Primary Gap" ? "0" : "-0.03em", lineHeight: 1.2 }}>
                  {m.value}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.3rem" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6"
               style={{ background: "#141414", border: `1px solid ${config.color}30` }}>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: config.color }} />
              <div>
                <p style={{ fontWeight: 700, color: "white", fontSize: "1rem", marginBottom: "0.4rem" }}>
                  Recommended Next Action
                </p>
                <p style={{ color: "#aaa", fontSize: "0.9rem", lineHeight: 1.7 }}>{config.action}</p>
              </div>
            </div>
          </div>

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