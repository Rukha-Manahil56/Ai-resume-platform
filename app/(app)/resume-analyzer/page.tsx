"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileBarChart, Loader2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import { GEMINI_BUSY_MESSAGE, GEMINI_UNAVAILABLE_CODE, type AnalyzeCvErrorResponse } from "@/lib/gemini-errors";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import { saveAnalysisToDatabase } from "@/lib/save-analysis";
import { getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { cn } from "@/lib/utils";

async function uploadAndExtractCv(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("/api/extract-cv", { method: "POST", body: formData });
  const data = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) throw new Error(data.error ?? "Failed to extract text from PDF.");
  if (!data.text) throw new Error("No text was returned from the server.");
  return data.text;
}

type AnalyzeCvOutcome =
  | { success: true; data: CvAnalysisResult }
  | { success: false; error: string; retryable: boolean };

async function analyzeCv(payload: { cvText: string; jobRole: string; jobDescription: string }): Promise<AnalyzeCvOutcome> {
  try {
    const response = await fetch("/api/analyze-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: (CvAnalysisResult & AnalyzeCvErrorResponse) | null = null;
    try { data = await response.json(); } catch {
      return { success: false, error: "Unexpected server response. Please try again.", retryable: true };
    }
    if (!response.ok) {
      return {
        success: false,
        error: data?.error ?? GEMINI_BUSY_MESSAGE,
        retryable: data?.retryable === true || data?.code === GEMINI_UNAVAILABLE_CODE || response.status === 503 || response.status === 429,
      };
    }
    if (typeof data?.atsScore !== "number") return { success: false, error: "Unexpected analysis data. Please try again.", retryable: true };
    return { success: true, data };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE, retryable: true };
  }
}

export default function ResumeAnalyzerPage() {
  const [jobTitle, setJobTitle]               = useState<JobTitle>(JOB_TITLES[0]);
  const [jobDescription, setJobDescription]   = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText]     = useState<string | null>(null);
  const [isExtracting, setIsExtracting]       = useState(false);
  const [extractError, setExtractError]       = useState<string | null>(null);
  const [isLoading, setIsLoading]             = useState(false);
  const [analysisResult, setAnalysisResult]   = useState<CvAnalysisResult | null>(null);
  const [analysisError, setAnalysisError]     = useState<string | null>(null);
  const [analysisErrorRetryable, setAnalysisErrorRetryable] = useState(false);
  const [saveWarning, setSaveWarning]         = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setExtractError(null); setExtractedText(null); setAnalysisResult(null);
    setAnalysisError(null); setAnalysisErrorRetryable(false);
    setSaveWarning(null); setSavedAnalysisId(null);
    setUploadedFileName(file.name); setIsExtracting(true);
    try {
      const text = await uploadAndExtractCv(file);
      setExtractedText(text);
    } catch (err) {
      setExtractedText(null);
      setExtractError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setIsExtracting(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1, multiple: false,
    disabled: isExtracting || isLoading,
  });

  function handleClearCv() {
    setUploadedFileName(null); setExtractedText(null); setExtractError(null);
    setAnalysisResult(null); setAnalysisError(null); setAnalysisErrorRetryable(false);
    setSaveWarning(null); setSavedAnalysisId(null);
  }

  async function handleAnalyze() {
    if (!extractedText?.trim()) { setAnalysisError("Upload a CV PDF before analyzing."); return; }
    if (!jobDescription.trim()) { setAnalysisError("Paste a job description before analyzing."); return; }
    setIsLoading(true); setAnalysisError(null); setAnalysisErrorRetryable(false);
    setSaveWarning(null); setSavedAnalysisId(null); setAnalysisResult(null);
    const outcome = await analyzeCv({ cvText: extractedText, jobRole: jobTitle, jobDescription });
    if (!outcome.success) {
      setAnalysisError(outcome.error); setAnalysisErrorRetryable(outcome.retryable);
      setIsLoading(false); return;
    }
    setAnalysisResult(outcome.data);
    const saveOutcome = await saveAnalysisToDatabase({
      cvText: extractedText, jobRole: jobTitle,
      atsScore: outcome.data.atsScore, fullAnalysis: outcome.data,
    });
    if (!saveOutcome.success) setSaveWarning(saveOutcome.error);
    else setSavedAnalysisId(saveOutcome.id);
    setIsLoading(false);
  }

  const canAnalyze = Boolean(extractedText?.trim()) && Boolean(jobDescription.trim()) && !isExtracting && !isLoading;

  /* ── shared dark card style ── */
  const card: React.CSSProperties = { background: "#141414", border: "1px solid #1e1e1e", borderRadius: "1rem" };
  const label: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 600, color: "#aaa", display: "block", marginBottom: "0.5rem" };

  return (
    <div className="relative min-h-screen" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* Purple glow */}
      <div className="fixed top-0 right-0 pointer-events-none" style={{
        width: "500px", height: "500px",
        background: "radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)",
      }} />

      {/* Full-page loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
             style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: "#7C3AED20", border: "1px solid #7C3AED40" }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#7C3AED" }} />
          </div>
          <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "white" }}>
            AI is analyzing your profile...
          </p>
          <p style={{ fontSize: "0.9rem", color: "#666" }}>This usually takes 15–30 seconds</p>
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-6 py-10 sm:px-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            Resume Analyzer
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            Upload your CV and paste the job description to get your ATS score
          </p>
        </div>

        <div className="flex flex-col gap-5">

          {/* ── Job title ── */}
          <div style={card} className="p-5">
            <span style={label}>Target job title</span>
            <select
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value as JobTitle)}
              disabled={isLoading}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "white" }}
            >
              {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* ── CV Upload ── */}
          <div style={card} className="p-5">
            <span style={label}>Upload your CV (PDF only)</span>

            {!uploadedFileName ? (
              <div
                {...getRootProps()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all"
                style={{
                  borderColor: isDragActive ? "#7C3AED" : "#2a2a2a",
                  background: isDragActive ? "rgba(124,58,237,0.05)" : "transparent",
                }}
              >
                <input {...getInputProps()} />
                {isExtracting ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#7C3AED" }} />
                    <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Extracting text from PDF…</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                         style={{ background: "#7C3AED20" }}>
                      <Upload className="w-6 h-6" style={{ color: "#7C3AED" }} />
                    </div>
                    <div>
                      <p style={{ color: "white", fontWeight: 600, fontSize: "0.95rem" }}>
                        {isDragActive ? "Drop your PDF here" : "Drag & drop your CV here"}
                      </p>
                      <p style={{ color: "#555", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                        or click to browse · PDF only · Max 10 MB
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                   style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
                <span className="flex items-center gap-2 truncate" style={{ color: "white", fontSize: "0.9rem" }}>
                  <FileText className="w-4 h-4 shrink-0" style={{ color: "#7C3AED" }} />
                  {uploadedFileName}
                </span>
                <button onClick={handleClearCv} disabled={isExtracting || isLoading}
                  className="shrink-0 rounded-lg p-1 transition-colors hover:bg-white/10"
                  style={{ color: "#666" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {isDragReject && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>Only PDF files are accepted.</p>
            )}
            {extractError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }} role="alert">{extractError}</p>
            )}
          </div>

          {/* ── Extracted text preview ── */}
          {extractedText && (
            <div style={card} className="p-5">
              <span style={label}>Extracted CV text — review before analyzing</span>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed"
                   style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "#ccc" }}>
                {extractedText}
              </pre>
            </div>
          )}

          {/* ── Job description ── */}
          <div style={card} className="p-5">
            <span style={label}>Job description</span>
            <textarea
              placeholder="Paste the full job description here…"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed outline-none resize-none disabled:opacity-50"
              style={{
                background: "#0f0f0f", border: "1px solid #2a2a2a",
                color: "white", fontFamily: "inherit",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
              onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
            />

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 active:scale-[0.98]"
              style={{ background: "#7C3AED", color: "white" }}
            >
              Analyze my CV
            </button>

            {analysisError && (
              <div className="mt-3 rounded-xl px-4 py-3 text-sm" role="alert"
                   style={{
                     background: analysisErrorRetryable ? "#1a1500" : "#1a0000",
                     border: `1px solid ${analysisErrorRetryable ? "#3a2e00" : "#3a0000"}`,
                     color: analysisErrorRetryable ? "#fbbf24" : "#f87171",
                   }}>
                <p className="font-semibold">{analysisErrorRetryable ? "Service temporarily unavailable" : "Analysis failed"}</p>
                <p className="mt-1">{analysisError}</p>
              </div>
            )}

            {saveWarning && (
              <div className="mt-3 rounded-xl px-4 py-3 text-sm"
                   style={{ background: "#1a1500", border: "1px solid #3a2e00", color: "#fbbf24" }}>
                {saveWarning}
              </div>
            )}
          </div>

          {/* ── Results ── */}
          {analysisResult && !isLoading && (
            <div style={card} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: "1.2rem", color: "white" }}>Analysis Results</h2>
                  <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.2rem" }}>Powered by Gemini AI</p>
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

              {/* Tabs */}
              <div>
                {/* Tab buttons */}
                {(() => {
                  const tabs = ["overview", "skills", "improvements", "interview"] as const;
                  const tabLabels = { overview: "Overview", skills: "Missing Skills", improvements: "Improvements", interview: "Interview Prep" };
                  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("overview");

                  return (
                    <>
                      <div className="flex gap-2 flex-wrap mb-6">
                        {tabs.map((t) => (
                          <button key={t} onClick={() => setActiveTab(t)}
                            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                            style={{
                              background: activeTab === t ? "#7C3AED" : "#1a1a1a",
                              color: activeTab === t ? "white" : "#777",
                              border: `1px solid ${activeTab === t ? "#7C3AED" : "#2a2a2a"}`,
                            }}>
                            {tabLabels[t]}
                          </button>
                        ))}
                      </div>

                      {/* Overview */}
                      {activeTab === "overview" && (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-end gap-4">
                            <p style={{ fontSize: "5rem", fontWeight: 900, color: "white", lineHeight: 1, letterSpacing: "-0.04em" }}>
                              {Math.round(analysisResult.atsScore)}
                            </p>
                            <div className="mb-2 flex flex-col gap-2">
                              <span style={{ fontSize: "0.8rem", color: "#666" }}>ATS Score</span>
                              <span className={cn("rounded-full border px-3 py-1 text-sm font-medium", getScoreBadgeStyle(analysisResult.atsScore))}>
                                {getScoreLabel(analysisResult.atsScore)}
                              </span>
                            </div>
                          </div>
                          <p style={{ color: "#888", lineHeight: 1.7, fontSize: "0.95rem" }}>{analysisResult.explanation}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {activeTab === "skills" && (
                        <div className="space-y-3">
                          {analysisResult.missingSkills.length === 0
                            ? <p style={{ color: "#666" }}>No major skill gaps identified.</p>
                            : analysisResult.missingSkills.map((skill) => (
                                <div key={skill.name} className="flex items-center justify-between rounded-xl px-4 py-3"
                                     style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
                                  <span style={{ fontWeight: 600, color: "white" }}>{skill.name}</span>
                                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                    skill.importance === "high"   && "border-red-800 bg-red-950 text-red-400",
                                    skill.importance === "medium" && "border-yellow-800 bg-yellow-950 text-yellow-400",
                                    skill.importance === "low"    && "border-zinc-700 bg-zinc-900 text-zinc-400",
                                  )}>
                                    {skill.importance}
                                  </span>
                                </div>
                              ))
                          }
                        </div>
                      )}

                      {/* Improvements */}
                      {activeTab === "improvements" && (
                        <div className="space-y-4">
                          {analysisResult.improvements.map((item, i) => (
                            <div key={i} className="rounded-xl p-4 space-y-3"
                                 style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
                              <p style={{ fontWeight: 600, color: "white", fontSize: "0.95rem" }}>{item.suggestion}</p>
                              <div className="rounded-lg p-3" style={{ background: "#1a0000", border: "1px solid #3a0000" }}>
                                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#f87171", marginBottom: "0.25rem" }}>BEFORE</p>
                                <p style={{ fontSize: "0.85rem", color: "#fca5a5" }}>{item.before}</p>
                              </div>
                              <div className="rounded-lg p-3" style={{ background: "#001a00", border: "1px solid #003a00" }}>
                                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4ade80", marginBottom: "0.25rem" }}>AFTER</p>
                                <p style={{ fontSize: "0.85rem", color: "#86efac" }}>{item.after}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interview */}
                      {activeTab === "interview" && (
                        <div className="space-y-4">
                          {analysisResult.interviewQuestions.map((item, i) => (
                            <div key={i} className="rounded-xl p-4"
                                 style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}>
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
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}