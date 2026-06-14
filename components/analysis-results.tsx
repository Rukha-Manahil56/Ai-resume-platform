"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
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

/* ── Career Readiness calculator (frontend only) ── */
function calcCareerReadiness(result: CvAnalysisResult, atsScore: number) {
  const totalSkills   = result.missingSkills.length;
  const highMissing   = result.missingSkills.filter((s) => s.importance === "high").length;
  const medMissing    = result.missingSkills.filter((s) => s.importance === "medium").length;

  // Skills match: penalise more for high-priority gaps
  const skillPenalty  = Math.min(100, highMissing * 15 + medMissing * 7 + (totalSkills - highMissing - medMissing) * 3);
  const skillsMatch   = Math.max(0, 100 - skillPenalty);

  // Resume quality: based on ATS score + number of improvements
  const improvPenalty = Math.min(40, result.improvements.length * 8);
  const resumeQuality = Math.max(0, Math.round(atsScore * 0.7 + 30 - improvPenalty));

  // Interview readiness: proportional to ATS but discounted by missing skills
  const interviewReadiness = Math.max(0, Math.round(atsScore * 0.6 + skillsMatch * 0.4) - highMissing * 5);

  // Improvement urgency (inverted — higher = LESS urgent = better)
  const urgencyRaw    = Math.max(0, 100 - highMissing * 20 - medMissing * 8);
  const improvUrgency = Math.min(100, urgencyRaw);

  const overall = Math.round(
    (atsScore * 0.35 + skillsMatch * 0.25 + resumeQuality * 0.2 + interviewReadiness * 0.2)
  );

  return {
    overall:            Math.min(100, overall),
    skillsMatch:        Math.min(100, Math.round(skillsMatch)),
    resumeQuality:      Math.min(100, Math.round(resumeQuality)),
    interviewReadiness: Math.min(100, Math.round(interviewReadiness)),
    improvUrgency:      Math.min(100, Math.round(improvUrgency)),
  };
}

function getReadinessLabel(score: number) {
  if (score >= 85) return { label: "Strong candidate",          color: "#22c55e", bg: "#f0faf4", border: "#c8ecd8" };
  if (score >= 70) return { label: "Good — needs refinement",  color: "#92400e", bg: "#fffbeb", border: "#fde68a" };
  return              { label: "Needs focused improvement",    color: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
}

/* ── Progress bar ── */
function MetricBar({
  label, value, sublabel, color = "#0a0a0a",
}: { label: string; value: number; sublabel?: string; color?: string }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
        <div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0a0a0a" }}>{label}</span>
          {sublabel && (
            <span style={{ fontSize: "11.5px", color: "#aaa", marginLeft: "8px" }}>{sublabel}</span>
          )}
        </div>
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#0a0a0a", letterSpacing: "-0.02em" }}>
          {value}%
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#f0f0f0",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: "3px",
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

/* ── Circular progress SVG ── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const gap = circumference - filled;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#f0f0f0" strokeWidth="10" />
      <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="70" y="62" textAnchor="middle"
        style={{ fill: "#0a0a0a", fontSize: "26px", fontWeight: 900, letterSpacing: "-1px" }}>
        {score}
      </text>
      <text x="70" y="80" textAnchor="middle"
        style={{ fill: "#aaa", fontSize: "11px", fontWeight: 500 }}>
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
    <div
      style={{
        border: "1px solid #e8e8e8",
        borderRadius: "10px",
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          padding: "14px 18px",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#fafafa")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0 }}>
          <span
            style={{
              flexShrink: 0,
              marginTop: "2px",
              width: "24px", height: "24px",
              borderRadius: "6px",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 700,
              background: "#f5f5f5",
              color: "#555",
              border: "1px solid #eee",
            }}
          >
            {index + 1}
          </span>
          <p style={{ fontWeight: 550, color: "#0a0a0a", fontSize: "13.5px", lineHeight: 1.55 }}>
            {item.question}
          </p>
        </div>
        <span style={{ color: "#bbb", flexShrink: 0, marginTop: "2px" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: "14px 18px 16px", borderTop: "1px solid #f0f0f0" }}>
          <p style={{
            fontSize: "10.5px", fontWeight: 700, color: "#aaa",
            letterSpacing: "0.06em", textTransform: "uppercase",
            marginBottom: "8px",
          }}>
            Model answer
          </p>
          <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.75 }}>
            {item.modelAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── PDF generator — unchanged ── */
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

  function checkPage(needed = 10) {
    if (y + needed > 270) { doc.addPage(); y = MARGIN; }
  }
  function sectionTitle(text: string) {
    checkPage(14); y += 6;
    doc.setFillColor(240, 240, 240);
    doc.rect(MARGIN, y, CONTENT, 8, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
    doc.text(text.toUpperCase(), MARGIN + 3, y + 5.5); y += 12;
  }
  function bodyText(text: string, indent = 0, color: [number, number, number] = [80, 80, 80]) {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, CONTENT - indent);
    lines.forEach((line: string) => { checkPage(6); doc.text(line, MARGIN + indent, y); y += 5.5; });
  }
  function labelText(text: string) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(120, 120, 120);
    doc.text(text, MARGIN, y); y += 4.5;
  }
  function divider() {
    checkPage(6); y += 3;
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(MARGIN, y, MARGIN + CONTENT, y); y += 4;
  }

  y = MARGIN;
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(10, 10, 10);
  doc.text("CareerLens", MARGIN, y);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(150, 150, 150);
  doc.text(date, PAGE_W - MARGIN, y, { align: "right" });
  y += 5;
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  doc.text("AI-Powered Resume Analysis Report", MARGIN, y); y += 8;
  doc.setDrawColor(10, 10, 10); doc.setLineWidth(0.6);
  doc.line(MARGIN, y, MARGIN + CONTENT, y); y += 8;

  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
  doc.text("Target Role", MARGIN, y); doc.text("ATS Score", MARGIN + 90, y); doc.text("Verdict", MARGIN + 130, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(10, 10, 10);
  doc.text(jobRole || "Not specified", MARGIN, y);
  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text(`${score}%`, MARGIN + 90, y);
  doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
  doc.text(config.label, MARGIN + 130, y); y += 10;
  divider();

  sectionTitle("1. Summary"); bodyText(result.explanation); y += 2;
  sectionTitle("2. Missing Skills");
  const highSkills   = result.missingSkills.filter((s) => s.importance === "high");
  const mediumSkills = result.missingSkills.filter((s) => s.importance === "medium");
  const lowSkills    = result.missingSkills.filter((s) => s.importance === "low");
  if (result.missingSkills.length === 0) { bodyText("No major skill gaps identified."); }
  else {
    if (highSkills.length)   { labelText("HIGH PRIORITY");   bodyText(highSkills.map((s) => `• ${s.name}`).join("   "), 0, [180, 40, 40]);   y += 2; }
    if (mediumSkills.length) { labelText("MEDIUM PRIORITY"); bodyText(mediumSkills.map((s) => `• ${s.name}`).join("   "), 0, [140, 100, 20]); y += 2; }
    if (lowSkills.length)    { labelText("LOW PRIORITY");    bodyText(lowSkills.map((s) => `• ${s.name}`).join("   "), 0, [100, 100, 100]);   y += 2; }
  }
  sectionTitle("3. Top 5 CV Improvements");
  result.improvements.forEach((item, i) => {
    checkPage(30);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
    doc.splitTextToSize(`${i + 1}. ${item.suggestion}`, CONTENT).forEach((l: string) => { doc.text(l, MARGIN, y); y += 5; });
    checkPage(10);
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(160, 40, 40); doc.text("BEFORE", MARGIN + 3, y); y += 4;
    doc.setFont("helvetica", "italic"); doc.setTextColor(120, 60, 60);
    doc.splitTextToSize(`"${item.before}"`, CONTENT - 6).forEach((l: string) => { checkPage(5); doc.text(l, MARGIN + 3, y); y += 4.5; });
    y += 1;
    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 120, 60); doc.text("AFTER", MARGIN + 3, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(30, 90, 50);
    doc.splitTextToSize(`"${item.after}"`, CONTENT - 6).forEach((l: string) => { checkPage(5); doc.text(l, MARGIN + 3, y); y += 4.5; });
    y += 4;
    if (i < result.improvements.length - 1) { doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.2); doc.line(MARGIN, y, MARGIN + CONTENT, y); y += 4; }
  });
  sectionTitle("4. Interview Questions & Model Answers");
  result.interviewQuestions.forEach((item, i) => {
    checkPage(20);
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(20, 20, 20);
    doc.splitTextToSize(`Q${i + 1}. ${item.question}`, CONTENT).forEach((l: string) => { checkPage(5); doc.text(l, MARGIN, y); y += 5; });
    checkPage(8);
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 60, 180); doc.text("Model Answer:", MARGIN + 3, y); y += 4.5;
    doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    doc.splitTextToSize(item.modelAnswer, CONTENT - 6).forEach((l: string) => { checkPage(5); doc.text(l, MARGIN + 3, y); y += 4.5; });
    y += 4;
  });
  sectionTitle("5. Final Recommendation");
  checkPage(40);
  doc.setFillColor(248, 248, 248); doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, CONTENT, 36, 2, 2, "FD");
  const innerY = y + 6;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
  doc.text("Overall Readiness", MARGIN + 4, innerY);
  doc.text(`${config.recommendation} Match — ${score}%`, MARGIN + 50, innerY);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
  const primaryGap = result.missingSkills.find((s) => s.importance === "high")?.name ?? result.missingSkills[0]?.name ?? "None identified";
  doc.text(`Primary gap:  ${primaryGap}`, MARGIN + 4, innerY + 8);
  doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40); doc.text("Next action:", MARGIN + 4, innerY + 16);
  doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
  doc.splitTextToSize(config.action, CONTENT - 10).forEach((l: string, idx: number) => { doc.text(l, MARGIN + 4, innerY + 22 + idx * 5); });
  y += 42;
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p); doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180);
    doc.text(`CareerLens  ·  Generated ${date}  ·  Page ${p} of ${totalPages}`, PAGE_W / 2, 290, { align: "center" });
  }
  doc.save(`CareerLens_Report_${(jobRole || "Analysis").replace(/\s+/g, "_")}_${Date.now()}.pdf`);
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export function AnalysisResults({ result, savedAnalysisId, saveWarning, jobRole }: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "skills" | "improvements" | "interview" | "readiness" | "recommendation"
  >("overview");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const score    = Math.round(result.atsScore);
  const config   = getScoreConfig(score);
  const readiness = calcCareerReadiness(result, score);
  const readinessLabel = getReadinessLabel(readiness.overall);

  const TABS = [
    { key: "overview",        label: "Overview"          },
    { key: "skills",          label: "Skill Gaps"        },
    { key: "improvements",    label: "Improvements"      },
    { key: "interview",       label: "Interview Prep"    },
    { key: "readiness",       label: "Career Readiness"  },
    { key: "recommendation",  label: "Verdict"           },
  ] as const;

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try { await generatePdfReport(result, jobRole ?? "Not specified", score, config); }
    catch (err) { console.error("PDF generation failed:", err); }
    finally { setIsGeneratingPdf(false); }
  }

  /* ── shared card style ── */
  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e8e8e8",
    borderRadius: "14px",
    padding: "24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Top header card ── */}
      <div style={card}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
              Analysis complete
            </p>
            <p style={{ fontSize: "1.3rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em" }}>
              CV vs Job Description
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "4px 12px", borderRadius: "20px",
                  fontSize: "12px", fontWeight: 600,
                  background: readinessLabel.bg,
                  color: readinessLabel.color,
                  border: `1px solid ${readinessLabel.border}`,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: readinessLabel.color, display: "inline-block" }} />
                {config.label}
              </span>
              {(result as { fromCache?: boolean }).fromCache && (
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "4px 10px", borderRadius: "20px",
                    fontSize: "11.5px", fontWeight: 500,
                    background: "#f5f5f5", color: "#888", border: "1px solid #eee",
                  }}
                >
                  Cached result
                </span>
              )}
            </div>
          </div>
          <ScoreRing score={score} color={config.color} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
          <button
            onClick={() => void handleDownloadPdf()}
            disabled={isGeneratingPdf}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "#f5f5f5", border: "1px solid #e4e4e4",
              color: "#0a0a0a", fontSize: "13px", fontWeight: 550,
              padding: "9px 16px", borderRadius: "9px",
              cursor: isGeneratingPdf ? "not-allowed" : "pointer",
              opacity: isGeneratingPdf ? 0.6 : 1, fontFamily: "inherit",
            }}
          >
            {isGeneratingPdf
              ? <><Loader2 size={14} style={{ animation: "spin 0.8s linear infinite" }} /> Generating PDF…</>
              : <><Download size={14} /> Download PDF</>}
          </button>
          {savedAnalysisId && (
            <Link
              href={`/reports/${savedAnalysisId}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                background: "#0a0a0a", color: "#fff",
                fontSize: "13px", fontWeight: 550,
                padding: "9px 16px", borderRadius: "9px",
                textDecoration: "none",
              }}
            >
              <FileBarChart size={14} /> View full report
            </Link>
          )}
        </div>

        {saveWarning && (
          <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "9px", background: "#fffbeb", border: "1px solid #fde68a", fontSize: "12.5px", color: "#92400e" }}>
            {saveWarning}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: "flex", gap: "2px", padding: "4px",
          background: "#f5f5f5", border: "1px solid #eee",
          borderRadius: "12px", flexWrap: "wrap",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "9px",
              fontSize: "12.5px",
              fontWeight: 550,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              minWidth: "80px",
              transition: "all 0.15s",
              background: activeTab === t.key ? "#fff" : "transparent",
              color:      activeTab === t.key ? "#0a0a0a" : "#888",
              boxShadow:  activeTab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={card}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              ATS score breakdown
            </p>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", color: "#555" }}>Match percentage</span>
                <span style={{ fontSize: "13.5px", fontWeight: 700, color: config.color }}>{score}%</span>
              </div>
              <div style={{ height: "6px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${score}%`, height: "100%", background: config.color, borderRadius: "3px", transition: "width 1s ease" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "16px" }}>
              {[
                { label: "Skills match",   value: `${readiness.skillsMatch}%` },
                { label: "Missing skills", value: `${result.missingSkills.length}` },
                { label: "Improvements",   value: `${result.improvements.length}` },
              ].map((m) => (
                <div key={m.label} style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "10px", padding: "14px", textAlign: "center" }}>
                  <p style={{ fontSize: "1.5rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</p>
                  <p style={{ fontSize: "11.5px", color: "#aaa", marginTop: "4px" }}>{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={card}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
              Summary
            </p>
            <p style={{ color: "#555", lineHeight: 1.8, fontSize: "14px" }}>{result.explanation}</p>
          </div>
        </div>
      )}

      {/* ── Skill Gaps ── */}
      {activeTab === "skills" && (
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
            Missing skills — {result.missingSkills.length} identified
          </p>
          {result.missingSkills.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 0" }}>
              <CheckCircle2 size={18} style={{ color: "#22c55e" }} />
              <p style={{ color: "#555", fontSize: "13.5px" }}>No major skill gaps identified.</p>
            </div>
          ) : (
            (["high", "medium", "low"] as const).map((level) => {
              const skills = result.missingSkills.filter((s) => s.importance === level);
              if (!skills.length) return null;
              const cfg = {
                high:   { label: "High priority",   color: "#991b1b", bg: "#fef2f2", border: "#fecaca" },
                medium: { label: "Medium priority",  color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
                low:    { label: "Low priority",     color: "#555",    bg: "#f5f5f5", border: "#e8e8e8" },
              }[level];
              return (
                <div key={level} style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, color: cfg.color, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {cfg.label}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                    {skills.map((skill) => (
                      <span key={skill.name}
                        style={{ padding: "5px 12px", borderRadius: "7px", fontSize: "12.5px", fontWeight: 500, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ ...card, paddingBottom: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Top 5 CV improvements
            </p>
            <p style={{ fontSize: "13px", color: "#aaa" }}>Apply these changes to improve your ATS score.</p>
          </div>
          {result.improvements.map((item, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ flexShrink: 0, width: "26px", height: "26px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, background: "#f5f5f5", color: "#555", border: "1px solid #eee", marginTop: "1px" }}>
                    {i + 1}
                  </span>
                  <p style={{ fontWeight: 600, color: "#0a0a0a", fontSize: "13.5px", lineHeight: 1.5 }}>{item.suggestion}</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }} className="improvement-cols">
                <div style={{ padding: "16px 20px", borderRight: "1px solid #f0f0f0" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#dc2626", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Before</p>
                  <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.7, fontStyle: "italic" }}>"{item.before}"</p>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 700, color: "#16a34a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>After</p>
                  <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.7 }}>"{item.after}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Interview Prep ── */}
      {activeTab === "interview" && (
        <div style={card}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
            Interview questions
          </p>
          <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px" }}>
            Click any question to reveal the model answer.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {result.interviewQuestions.map((item, i) => (
              <QuestionCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* ── Career Readiness ── */}
      {activeTab === "readiness" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Big score card */}
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
                Career readiness score
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px" }}>
                <span style={{ fontSize: "3.5rem", fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.05em", lineHeight: 1 }}>
                  {readiness.overall}
                </span>
                <span style={{ fontSize: "1.2rem", color: "#bbb", fontWeight: 400 }}>/100</span>
              </div>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "5px 14px", borderRadius: "20px",
                  fontSize: "12px", fontWeight: 600,
                  background: readinessLabel.bg,
                  color: readinessLabel.color,
                  border: `1px solid ${readinessLabel.border}`,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: readinessLabel.color, display: "inline-block" }} />
                {readinessLabel.label}
              </span>
            </div>
            {/* Mini ring */}
            <div style={{ flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="44" fill="none" stroke="#f0f0f0" strokeWidth="8" />
                <circle
                  cx="55" cy="55" r="44"
                  fill="none"
                  stroke={readiness.overall >= 85 ? "#22c55e" : readiness.overall >= 70 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(readiness.overall / 100) * 2 * Math.PI * 44} ${2 * Math.PI * 44}`}
                  strokeDashoffset={2 * Math.PI * 44 * 0.25}
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
                <text x="55" y="50" textAnchor="middle" style={{ fill: "#0a0a0a", fontSize: "20px", fontWeight: 800 }}>
                  {readiness.overall}
                </text>
                <text x="55" y="66" textAnchor="middle" style={{ fill: "#aaa", fontSize: "9px" }}>
                  / 100
                </text>
              </svg>
            </div>
          </div>

          {/* Sub-metric bars */}
          <div style={card}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>
              Score breakdown
            </p>
            <MetricBar
              label="ATS Match"
              value={score}
              sublabel="How well your CV matches the job description"
              color={score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444"}
            />
            <MetricBar
              label="Skills Match"
              value={readiness.skillsMatch}
              sublabel="Keyword and skills alignment"
              color={readiness.skillsMatch >= 70 ? "#22c55e" : readiness.skillsMatch >= 50 ? "#f59e0b" : "#ef4444"}
            />
            <MetricBar
              label="Resume Quality"
              value={readiness.resumeQuality}
              sublabel="Strength of your current CV content"
              color={readiness.resumeQuality >= 70 ? "#22c55e" : readiness.resumeQuality >= 50 ? "#f59e0b" : "#ef4444"}
            />
            <MetricBar
              label="Interview Readiness"
              value={readiness.interviewReadiness}
              sublabel="Estimated readiness for interview questions"
              color={readiness.interviewReadiness >= 70 ? "#22c55e" : readiness.interviewReadiness >= 50 ? "#f59e0b" : "#ef4444"}
            />
            <MetricBar
              label="Improvement Urgency"
              value={readiness.improvUrgency}
              sublabel="Higher = fewer urgent changes needed"
              color={readiness.improvUrgency >= 70 ? "#22c55e" : readiness.improvUrgency >= 50 ? "#f59e0b" : "#ef4444"}
            />
          </div>

          {/* Four metric mini-cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            {[
              { label: "Resume Quality",      value: readiness.resumeQuality,      desc: "Based on ATS score and improvement count" },
              { label: "Skills Match",         value: readiness.skillsMatch,         desc: "Keyword alignment with job description"    },
              { label: "Interview Readiness",  value: readiness.interviewReadiness,  desc: "Estimated readiness for common questions"  },
              { label: "Improvement Urgency",  value: readiness.improvUrgency,       desc: "Higher score = fewer critical gaps"         },
            ].map((m) => {
              const c = m.value >= 70 ? "#22c55e" : m.value >= 50 ? "#f59e0b" : "#ef4444";
              const bg = m.value >= 70 ? "#f0faf4" : m.value >= 50 ? "#fffbeb" : "#fef2f2";
              const border = m.value >= 70 ? "#c8ecd8" : m.value >= 50 ? "#fde68a" : "#fecaca";
              return (
                <div key={m.label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: "12px", padding: "18px" }}>
                  <p style={{ fontSize: "11.5px", color: c, fontWeight: 600, marginBottom: "6px" }}>{m.label}</p>
                  <p style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "4px" }}>
                    {m.value}<span style={{ fontSize: "0.9rem", color: "#bbb", fontWeight: 400 }}>%</span>
                  </p>
                  <p style={{ fontSize: "11px", color: "#888", lineHeight: 1.5 }}>{m.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Recommendation box */}
          <div style={{ ...card, borderLeft: "3px solid #0a0a0a" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#0a0a0a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Recommendation
            </p>
            <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.75 }}>
              {readiness.overall >= 85
                ? "You're a strong candidate for this role. Focus on interview preparation and practising your responses to the generated questions."
                : readiness.overall >= 70
                ? "You have a good foundation but targeted improvements will increase your chances. Apply the CV suggestions and address medium-priority skill gaps before applying."
                : "Your profile needs focused improvement before applying. Address the high-priority skill gaps, rewrite the flagged CV sections, and then run another analysis to track your progress."}
            </p>
          </div>
        </div>
      )}

      {/* ── Verdict ── */}
      {activeTab === "recommendation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={card}>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>
              Overall readiness
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", background: readinessLabel.bg, border: `1px solid ${readinessLabel.border}`, flexShrink: 0 }}>
                <TrendingUp size={22} style={{ color: readinessLabel.color }} />
              </div>
              <div>
                <p style={{ fontSize: "1.3rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em" }}>
                  {config.recommendation} match
                </p>
                <p style={{ fontSize: "13.5px", color: "#888", marginTop: "2px" }}>{config.sublabel}</p>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { label: "ATS score",    value: `${score}%`, sub: config.label },
              { label: "Primary gap",  value: result.missingSkills.find((s) => s.importance === "high")?.name ?? result.missingSkills[0]?.name ?? "None", sub: "Highest priority skill" },
              { label: "Skills to add", value: `${result.missingSkills.length}`, sub: `${result.missingSkills.filter((s) => s.importance === "high").length} high priority` },
            ].map((m) => (
              <div key={m.label} style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "12px", padding: "18px" }}>
                <p style={{ fontSize: "10.5px", fontWeight: 600, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{m.label}</p>
                <p style={{ fontSize: m.label === "Primary gap" ? "0.95rem" : "1.8rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2 }}>{m.value}</p>
                <p style={{ fontSize: "11.5px", color: "#aaa", marginTop: "4px" }}>{m.sub}</p>
              </div>
            ))}
          </div>

          <div style={{ ...card, borderLeft: "3px solid #0a0a0a" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <CheckCircle2 size={18} style={{ color: "#0a0a0a", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ fontWeight: 650, color: "#0a0a0a", fontSize: "14px", marginBottom: "6px" }}>Recommended next action</p>
                <p style={{ color: "#555", fontSize: "13.5px", lineHeight: 1.75 }}>{config.action}</p>
              </div>
            </div>
          </div>

          {savedAnalysisId && (
            <Link
              href={`/reports/${savedAnalysisId}`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                width: "100%", padding: "13px",
                background: "#0a0a0a", color: "#fff",
                borderRadius: "10px", fontSize: "13.5px", fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <FileBarChart size={15} /> View full hiring readiness report
            </Link>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 540px) {
          .improvement-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}