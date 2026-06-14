"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  FileText, Loader2, Upload, X, Plus,
  CheckCircle2, RotateCcw, ChevronRight,
} from "lucide-react";

import { AnalysisResults } from "@/components/analysis-results";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import {
  GEMINI_BUSY_MESSAGE,
  GEMINI_UNAVAILABLE_CODE,
  type AnalyzeCvErrorResponse,
} from "@/lib/gemini-errors";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import { saveAnalysisToDatabase } from "@/lib/save-analysis";

/* ── API helpers — unchanged ── */
async function uploadAndExtractCv(file: File): Promise<string> {
  const { extractPdfTextInBrowser } = await import("@/lib/extract-pdf-client");
  const text = await extractPdfTextInBrowser(file);
  if (!text || text.length < 20) {
    throw new Error(
      "No readable text found in this PDF. Make sure it is not a scanned image."
    );
  }
  return text;
}

type AnalyzeCvOutcome =
  | { success: true; data: CvAnalysisResult }
  | { success: false; error: string; retryable: boolean };

async function analyzeCv(payload: {
  cvText: string;
  jobRole: string;
  jobDescription: string;
}): Promise<AnalyzeCvOutcome> {
  try {
    const res = await fetch("/api/analyze-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: (CvAnalysisResult & AnalyzeCvErrorResponse) | null = null;
    try {
      data = await res.json();
    } catch {
      return { success: false, error: "Unexpected server response.", retryable: true };
    }
    if (!res.ok) {
      return {
        success: false,
        error: data?.error ?? GEMINI_BUSY_MESSAGE,
        retryable:
          data?.retryable === true ||
          data?.code === GEMINI_UNAVAILABLE_CODE ||
          res.status === 503 ||
          res.status === 429,
      };
    }
    if (typeof data?.atsScore !== "number")
      return { success: false, error: "Unexpected analysis data.", retryable: true };
    return { success: true, data };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE, retryable: true };
  }
}

/* ── Loading steps ── */
const LOADING_STEPS = [
  "Extracting resume content...",
  "Matching skills with job requirements...",
  "Generating improvement suggestions...",
  "Preparing interview questions...",
];

/* ── Page ── */
export default function ResumeAnalyzerPage() {
  const [jobTitle, setJobTitle]                   = useState<JobTitle>(JOB_TITLES[0]);
  const [jobDescription, setJobDescription]       = useState("");
  const [uploadedFileName, setUploadedFileName]   = useState<string | null>(null);
  const [extractedText, setExtractedText]         = useState<string | null>(null);
  const [isExtracting, setIsExtracting]           = useState(false);
  const [extractError, setExtractError]           = useState<string | null>(null);
  const [isLoading, setIsLoading]                 = useState(false);
  const [loadingStep, setLoadingStep]             = useState(0);
  const [analysisResult, setAnalysisResult]       = useState<CvAnalysisResult | null>(null);
  const [analysisError, setAnalysisError]         = useState<string | null>(null);
  const [analysisRetryable, setAnalysisRetryable] = useState(false);
  const [saveWarning, setSaveWarning]             = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId]     = useState<string | null>(null);

  /* ── Reset ── */
  function handleReset() {
    setJobTitle(JOB_TITLES[0]);
    setJobDescription("");
    setUploadedFileName(null);
    setExtractedText(null);
    setIsExtracting(false);
    setExtractError(null);
    setIsLoading(false);
    setLoadingStep(0);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisRetryable(false);
    setSaveWarning(null);
    setSavedAnalysisId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ── Drop ── */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setExtractError(null);
    setExtractedText(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSaveWarning(null);
    setSavedAnalysisId(null);
    setUploadedFileName(file.name);
    setIsExtracting(true);
    try {
      setExtractedText(await uploadAndExtractCv(file));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled: isExtracting || isLoading,
  });

  function handleClearCv() {
    setUploadedFileName(null);
    setExtractedText(null);
    setExtractError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSaveWarning(null);
    setSavedAnalysisId(null);
  }

  /* ── Analyze ── */
  async function handleAnalyze() {
    if (!extractedText?.trim()) { setAnalysisError("Upload a CV PDF before analyzing."); return; }
    if (!jobDescription.trim()) { setAnalysisError("Paste a job description before analyzing."); return; }

    setIsLoading(true);
    setLoadingStep(0);
    setAnalysisError(null);
    setAnalysisRetryable(false);
    setSaveWarning(null);
    setSavedAnalysisId(null);
    setAnalysisResult(null);

    /* Cycle loading steps visually */
    let step = 0;
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1);
      setLoadingStep(step);
    }, 4000);

    const outcome = await analyzeCv({
      cvText: extractedText,
      jobRole: jobTitle,
      jobDescription,
    });

    clearInterval(stepInterval);

    if (!outcome.success) {
      setAnalysisError(outcome.error);
      setAnalysisRetryable(outcome.retryable);
      setIsLoading(false);
      return;
    }

    setAnalysisResult(outcome.data);

    const saved = await saveAnalysisToDatabase({
      cvText: extractedText,
      jobRole: jobTitle,
      atsScore: outcome.data.atsScore,
      fullAnalysis: outcome.data,
    });

    if (!saved.success) setSaveWarning(saved.error);
    else setSavedAnalysisId(saved.id);

    setIsLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canAnalyze =
    Boolean(extractedText?.trim()) &&
    Boolean(jobDescription.trim()) &&
    !isExtracting &&
    !isLoading;

  /* Derive step state */
  const step1Done = Boolean(extractedText);
  const step2Done = Boolean(jobDescription.trim());
  const activeStep = !step1Done ? 1 : !step2Done ? 2 : 3;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#f9f9f9", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div style={{ width: "320px", textAlign: "center" }}>
            {/* Spinner */}
            <div
              style={{
                width: "52px",
                height: "52px",
                border: "2px solid #e8e8e8",
                borderTop: "2px solid #0a0a0a",
                borderRadius: "50%",
                margin: "0 auto 32px",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {/* Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {LOADING_STEPS.map((s, i) => {
                const done    = i < loadingStep;
                const active  = i === loadingStep;
                return (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      background: active ? "#fff" : "transparent",
                      border: active ? "1px solid #e4e4e4" : "1px solid transparent",
                      boxShadow: active ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {done ? (
                        <CheckCircle2 size={16} style={{ color: "#2d7a4f" }} />
                      ) : active ? (
                        <div
                          style={{
                            width: "16px", height: "16px",
                            border: "2px solid #ccc",
                            borderTop: "2px solid #0a0a0a",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      ) : (
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1px solid #ddd" }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: "13.5px",
                      fontWeight: active ? 550 : 400,
                      color: done ? "#888" : active ? "#0a0a0a" : "#bbb",
                      textAlign: "left",
                    }}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: "12px", color: "#bbb", marginTop: "24px" }}>
              Usually takes 15–30 seconds
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── Results view ── */}
      {analysisResult && !isLoading && (
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px 80px" }}>
          {/* Results header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#aaa",
                  marginBottom: "6px",
                }}
              >
                Analysis complete
              </div>
              <h1
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                  fontWeight: 750,
                  color: "#0a0a0a",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.15,
                }}
              >
                {jobTitle}
              </h1>
              <p style={{ fontSize: "14px", color: "#888", marginTop: "4px" }}>
                Resume report · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <button
              onClick={handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "#fff",
                border: "1px solid #e0e0e0",
                color: "#0a0a0a",
                fontSize: "13.5px",
                fontWeight: 550,
                padding: "9px 18px",
                borderRadius: "9px",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#aaa")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#e0e0e0")}
            >
              <RotateCcw size={14} />
              Analyze another resume
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#ebebeb", marginBottom: "32px" }} />

          {/* Existing analysis results component — untouched */}
          <AnalysisResults
            result={analysisResult}
            savedAnalysisId={savedAnalysisId}
            saveWarning={saveWarning}
            jobRole={jobTitle}
          />

          {/* Bottom reset */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: "48px" }}>
            <button
              onClick={handleReset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "#0a0a0a",
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 550,
                padding: "11px 24px",
                borderRadius: "9px",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              <Plus size={14} />
              Analyze another resume
            </button>
          </div>
        </div>
      )}

      {/* ── Form view ── */}
      {!analysisResult && (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Page header */}
          <div style={{ marginBottom: "32px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#aaa",
                marginBottom: "8px",
              }}
            >
              Career tools
            </div>
            <h1
              style={{
                fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
                fontWeight: 750,
                color: "#0a0a0a",
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
                marginBottom: "8px",
              }}
            >
              Resume analyzer
            </h1>
            <p style={{ fontSize: "14.5px", color: "#888", lineHeight: 1.6 }}>
              Upload your CV and paste a job description to get your ATS score, skill gaps, and tailored improvements.
            </p>
          </div>

          {/* ── Step indicator ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0",
              marginBottom: "32px",
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "12px",
              padding: "4px",
              width: "fit-content",
            }}
          >
            {[
              { n: 1, label: "Upload CV",       done: step1Done },
              { n: 2, label: "Add job details", done: step2Done },
              { n: 3, label: "Generate report", done: false     },
            ].map((s, i) => {
              const isActive = activeStep === s.n;
              return (
                <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "7px 14px",
                      borderRadius: "8px",
                      background: isActive ? "#0a0a0a" : "transparent",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: s.done ? "#0a0a0a" : isActive ? "#fff" : "#f0f0f0",
                        flexShrink: 0,
                      }}
                    >
                      {s.done ? (
                        <CheckCircle2 size={12} style={{ color: "#fff" }} />
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: isActive ? "#0a0a0a" : "#aaa",
                          }}
                        >
                          {s.n}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "12.5px",
                        fontWeight: 550,
                        color: isActive ? "#fff" : s.done ? "#555" : "#aaa",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <ChevronRight size={14} style={{ color: "#ddd", flexShrink: 0, margin: "0 2px" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Two-column layout ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              alignItems: "start",
            }}
            className="resume-grid"
          >

            {/* ── LEFT: Upload + preview ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Upload card */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: "14px",
                  padding: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "13.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                      Upload CV
                    </p>
                    <p style={{ fontSize: "12px", color: "#aaa", marginTop: "2px" }}>PDF format only</p>
                  </div>
                  <div
                    style={{
                      width: "32px", height: "32px",
                      background: "#f5f5f5",
                      border: "1px solid #eee",
                      borderRadius: "8px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <FileText size={15} style={{ color: "#888" }} />
                  </div>
                </div>

                {/* Dropzone */}
                {!uploadedFileName ? (
                  <div
                    {...getRootProps()}
                    style={{
                      border: `2px dashed ${isDragActive ? "#0a0a0a" : "#ddd"}`,
                      borderRadius: "10px",
                      padding: "36px 20px",
                      textAlign: "center",
                      cursor: isExtracting || isLoading ? "not-allowed" : "pointer",
                      background: isDragActive ? "#f5f5f5" : "#fafafa",
                      transition: "all 0.2s",
                    }}
                  >
                    <input {...getInputProps()} />
                    {isExtracting ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "28px", height: "28px",
                            border: "2px solid #e0e0e0",
                            borderTop: "2px solid #0a0a0a",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        <p style={{ fontSize: "13px", color: "#888" }}>Extracting resume content...</p>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            width: "40px", height: "40px",
                            background: "#f0f0f0",
                            border: "1px solid #e4e4e4",
                            borderRadius: "10px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 14px",
                          }}
                        >
                          <Upload size={17} style={{ color: "#666" }} />
                        </div>
                        <p style={{ fontSize: "13.5px", fontWeight: 550, color: "#0a0a0a", marginBottom: "4px" }}>
                          {isDragActive ? "Drop your PDF here" : "Drag & drop your CV"}
                        </p>
                        <p style={{ fontSize: "12px", color: "#bbb" }}>
                          or click to browse · PDF only · Max 10 MB
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                      padding: "12px 14px",
                      background: "#f9f9f9",
                      border: "1px solid #e8e8e8",
                      borderRadius: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div
                        style={{
                          width: "32px", height: "32px", flexShrink: 0,
                          background: "#f0f0f0",
                          border: "1px solid #e4e4e4",
                          borderRadius: "8px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <FileText size={14} style={{ color: "#555" }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 550,
                            color: "#0a0a0a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {uploadedFileName}
                        </p>
                        <p style={{ fontSize: "11.5px", color: "#aaa", marginTop: "1px" }}>
                          {extractedText
                            ? `${extractedText.split(" ").length.toLocaleString()} words extracted`
                            : "Processing..."}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {extractedText && (
                        <span
                          style={{
                            fontSize: "11px", fontWeight: 600,
                            background: "#f0faf4", color: "#2d7a4f",
                            border: "1px solid #c8ecd8",
                            padding: "2px 8px", borderRadius: "20px",
                          }}
                        >
                          Ready
                        </span>
                      )}
                      <button
                        onClick={handleClearCv}
                        disabled={isExtracting || isLoading}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          padding: "4px", borderRadius: "6px", color: "#bbb",
                          display: "flex", alignItems: "center",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#bbb")}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {isDragReject && (
                  <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }}>
                    Only PDF files are accepted.
                  </p>
                )}
                {extractError && (
                  <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "8px" }} role="alert">
                    {extractError}
                  </p>
                )}
              </div>

              {/* Extracted text preview */}
              {extractedText && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e8e8e8",
                    borderRadius: "14px",
                    padding: "20px 24px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                      Extracted content
                    </p>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>
                      {extractedText.split(" ").length.toLocaleString()} words
                    </span>
                  </div>
                  <pre
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      whiteSpace: "pre-wrap",
                      fontSize: "11.5px",
                      lineHeight: 1.7,
                      color: "#666",
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                      borderRadius: "8px",
                      padding: "14px",
                      margin: 0,
                      fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    {extractedText}
                  </pre>
                </div>
              )}
            </div>

            {/* ── RIGHT: Job details + Analyze ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Job role dropdown */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: "14px",
                  padding: "20px 24px",
                }}
              >
                <p style={{ fontSize: "13.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em", marginBottom: "4px" }}>
                  Target job role
                </p>
                <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "14px" }}>
                  Select the role you're applying for
                </p>
                <select
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value as JobTitle)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    background: "#fafafa",
                    border: "1px solid #e4e4e4",
                    borderRadius: "9px",
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    color: "#0a0a0a",
                    outline: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    appearance: "auto",
                  }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "#0a0a0a")}
                  onBlur={(e)  => ((e.target as HTMLElement).style.borderColor = "#e4e4e4")}
                >
                  {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Job description */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: "14px",
                  padding: "20px 24px",
                  flex: 1,
                }}
              >
                <p style={{ fontSize: "13.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em", marginBottom: "4px" }}>
                  Job requirements
                </p>
                <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "14px" }}>
                  Paste the full job description for the most accurate match
                </p>
                <textarea
                  placeholder="e.g. We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and AWS..."
                  rows={10}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    background: "#fafafa",
                    border: "1px solid #e4e4e4",
                    borderRadius: "9px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#0a0a0a",
                    lineHeight: 1.7,
                    outline: "none",
                    resize: "vertical",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "#0a0a0a")}
                  onBlur={(e)  => ((e.target as HTMLElement).style.borderColor = "#e4e4e4")}
                />

                {/* Character count */}
                {jobDescription && (
                  <p style={{ fontSize: "11px", color: "#bbb", marginTop: "6px", textAlign: "right" }}>
                    {jobDescription.trim().split(/\s+/).length} words
                  </p>
                )}
              </div>

              {/* Analyze button + error */}
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: "14px",
                  padding: "20px 24px",
                }}
              >
                {/* Checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {[
                    { label: "CV uploaded and extracted", done: step1Done },
                    { label: "Job description added",     done: step2Done },
                  ].map((c) => (
                    <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {c.done ? (
                        <CheckCircle2 size={14} style={{ color: "#2d7a4f", flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: "14px", height: "14px", borderRadius: "50%",
                          border: "1.5px solid #ddd", flexShrink: 0,
                        }} />
                      )}
                      <span style={{ fontSize: "12.5px", color: c.done ? "#555" : "#bbb", fontWeight: c.done ? 450 : 400 }}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  style={{
                    width: "100%",
                    background: canAnalyze ? "#0a0a0a" : "#f0f0f0",
                    color: canAnalyze ? "#fff" : "#bbb",
                    border: "none",
                    borderRadius: "9px",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: canAnalyze ? "pointer" : "not-allowed",
                    letterSpacing: "-0.01em",
                    transition: "opacity 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { if (canAnalyze) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                  onMouseLeave={(e) => { if (canAnalyze) (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Generate report
                </button>

                <p style={{ fontSize: "11.5px", color: "#bbb", textAlign: "center", marginTop: "10px" }}>
                  Analysis takes 15–30 seconds
                </p>

                {/* Error */}
                {analysisError && (
                  <div
                    role="alert"
                    style={{
                      marginTop: "14px",
                      padding: "12px 14px",
                      borderRadius: "9px",
                      background: analysisRetryable ? "#fffbeb" : "#fef2f2",
                      border: `1px solid ${analysisRetryable ? "#fde68a" : "#fecaca"}`,
                    }}
                  >
                    <p style={{ fontSize: "13px", fontWeight: 600, color: analysisRetryable ? "#92400e" : "#991b1b", marginBottom: "2px" }}>
                      {analysisRetryable ? "Service temporarily unavailable" : "Analysis failed"}
                    </p>
                    <p style={{ fontSize: "12.5px", color: analysisRetryable ? "#b45309" : "#b91c1c" }}>
                      {analysisError}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .resume-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}