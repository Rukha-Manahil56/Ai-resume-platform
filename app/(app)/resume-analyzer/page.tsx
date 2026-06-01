"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2, Upload, X } from "lucide-react";

import { AnalysisResults } from "@/components/analysis-results";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import {
  GEMINI_BUSY_MESSAGE,
  GEMINI_UNAVAILABLE_CODE,
  type AnalyzeCvErrorResponse,
} from "@/lib/gemini-errors";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import { saveAnalysisToDatabase } from "@/lib/save-analysis";

/* ── API helpers — unchanged logic ── */
async function uploadAndExtractCv(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract-cv", { method: "POST", body: formData });
  const data = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Failed to extract text from PDF.");
  if (!data.text) throw new Error("No text was returned from the server.");
  return data.text;
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
    try { data = await res.json(); } catch {
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

/* ── Page ── */
export default function ResumeAnalyzerPage() {
  const [jobTitle, setJobTitle]             = useState<JobTitle>(JOB_TITLES[0]);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText]   = useState<string | null>(null);
  const [isExtracting, setIsExtracting]     = useState(false);
  const [extractError, setExtractError]     = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CvAnalysisResult | null>(null);
  const [analysisError, setAnalysisError]   = useState<string | null>(null);
  const [analysisRetryable, setAnalysisRetryable] = useState(false);
  const [saveWarning, setSaveWarning]       = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setExtractError(null); setExtractedText(null); setAnalysisResult(null);
    setAnalysisError(null); setSaveWarning(null); setSavedAnalysisId(null);
    setUploadedFileName(file.name); setIsExtracting(true);
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
    maxFiles: 1, multiple: false,
    disabled: isExtracting || isLoading,
  });

  function handleClearCv() {
    setUploadedFileName(null); setExtractedText(null); setExtractError(null);
    setAnalysisResult(null); setAnalysisError(null);
    setSaveWarning(null); setSavedAnalysisId(null);
  }

  async function handleAnalyze() {
    if (!extractedText?.trim()) { setAnalysisError("Upload a CV PDF before analyzing."); return; }
    if (!jobDescription.trim()) { setAnalysisError("Paste a job description before analyzing."); return; }
    setIsLoading(true); setAnalysisError(null); setAnalysisRetryable(false);
    setSaveWarning(null); setSavedAnalysisId(null); setAnalysisResult(null);

    const outcome = await analyzeCv({ cvText: extractedText, jobRole: jobTitle, jobDescription });
    if (!outcome.success) {
      setAnalysisError(outcome.error); setAnalysisRetryable(outcome.retryable);
      setIsLoading(false); return;
    }
    setAnalysisResult(outcome.data);

    const saved = await saveAnalysisToDatabase({
      cvText: extractedText, jobRole: jobTitle,
      atsScore: outcome.data.atsScore, fullAnalysis: outcome.data,
    });
    if (!saved.success) setSaveWarning(saved.error);
    else setSavedAnalysisId(saved.id);
    setIsLoading(false);
  }

  const canAnalyze =
    Boolean(extractedText?.trim()) && Boolean(jobDescription.trim()) &&
    !isExtracting && !isLoading;

  /* shared styles */
  const card: React.CSSProperties = {
    background: "#141414", border: "1px solid #1e1e1e", borderRadius: "1rem",
  };
  const lbl: React.CSSProperties = {
    fontSize: "0.85rem", fontWeight: 600, color: "#aaa",
    display: "block", marginBottom: "0.5rem",
  };

  return (
    <div className="relative min-h-screen" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Purple glow */}
      <div className="fixed top-0 right-0 pointer-events-none" style={{
        width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
      }} />

      {/* Loading overlay */}
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
            <span style={lbl}>Target job title</span>
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
            <span style={lbl}>Upload your CV (PDF only)</span>

            {!uploadedFileName ? (
              <div
                {...getRootProps()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all"
                style={{
                  borderColor: isDragActive ? "#7C3AED" : "#2a2a2a",
                  background:  isDragActive ? "rgba(124,58,237,0.05)" : "transparent",
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
                <span className="flex items-center gap-2 truncate"
                      style={{ color: "white", fontSize: "0.9rem" }}>
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
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Only PDF files are accepted.
              </p>
            )}
            {extractError && (
              <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }} role="alert">
                {extractError}
              </p>
            )}
          </div>

          {/* ── Extracted text preview ── */}
          {extractedText && (
            <div style={card} className="p-5">
              <span style={lbl}>Extracted CV text — review before analyzing</span>
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed"
                   style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "#ccc" }}>
                {extractedText}
              </pre>
            </div>
          )}

          {/* ── Job description ── */}
          <div style={card} className="p-5">
            <span style={lbl}>Job description</span>
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
              onBlur={(e)  => (e.target.style.borderColor = "#2a2a2a")}
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
                     background: analysisRetryable ? "#1a1500"   : "#1a0000",
                     border:    `1px solid ${analysisRetryable ? "#3a2e00" : "#3a0000"}`,
                     color:      analysisRetryable ? "#fbbf24"   : "#f87171",
                   }}>
                <p className="font-semibold">
                  {analysisRetryable ? "Service temporarily unavailable" : "Analysis failed"}
                </p>
                <p className="mt-1">{analysisError}</p>
              </div>
            )}
          </div>

          {/* ── Results ── */}
          {analysisResult && !isLoading && (
            <AnalysisResults
              result={analysisResult}
              savedAnalysisId={savedAnalysisId}
              saveWarning={saveWarning}
            />
          )}

        </div>
      </div>
    </div>
  );
}