"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, FileBarChart, Loader2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import {
  GEMINI_BUSY_MESSAGE,
  GEMINI_UNAVAILABLE_CODE,
  type AnalyzeCvErrorResponse,
} from "@/lib/gemini-errors";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import { saveAnalysisToDatabase } from "@/lib/save-analysis";
import { getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { cn } from "@/lib/utils";

/**
 * Send the PDF to our API route and return the extracted text.
 * Throws an error with a human-readable message if something goes wrong.
 */
async function uploadAndExtractCv(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-cv", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { text?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to extract text from PDF.");
  }

  if (!data.text) {
    throw new Error("No text was returned from the server.");
  }

  return data.text;
}

type AnalyzeCvOutcome =
  | { success: true; data: CvAnalysisResult }
  | { success: false; error: string; retryable: boolean };

/**
 * Send CV text, role, and job description to Gemini via /api/analyze-cv.
 * Never throws — returns a result object so the UI cannot crash on API errors.
 */
async function analyzeCv(payload: {
  cvText: string;
  jobRole: string;
  jobDescription: string;
}): Promise<AnalyzeCvOutcome> {
  try {
    const response = await fetch("/api/analyze-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: (CvAnalysisResult & AnalyzeCvErrorResponse) | null = null;

    try {
      data = (await response.json()) as CvAnalysisResult & AnalyzeCvErrorResponse;
    } catch {
      return {
        success: false,
        error: "Unexpected server response. Please try again.",
        retryable: true,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.error ?? GEMINI_BUSY_MESSAGE,
        retryable:
          data?.retryable === true ||
          data?.code === GEMINI_UNAVAILABLE_CODE ||
          response.status === 503 ||
          response.status === 429,
      };
    }

    if (typeof data?.atsScore !== "number") {
      return {
        success: false,
        error: "Unexpected analysis data. Please try again.",
        retryable: true,
      };
    }

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: GEMINI_BUSY_MESSAGE,
      retryable: true,
    };
  }
}

// Route: /resume-analyzer
export default function ResumeAnalyzerPage() {
  const [jobTitle, setJobTitle] = useState<JobTitle>(JOB_TITLES[0]);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CvAnalysisResult | null>(
    null
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisErrorRetryable, setAnalysisErrorRetryable] = useState(false);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

  /**
   * Called by react-dropzone when the user drops a file or picks one from the dialog.
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setExtractError(null);
    setExtractedText(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisErrorRetryable(false);
    setSaveWarning(null);
    setSavedAnalysisId(null);
    setUploadedFileName(file.name);
    setIsExtracting(true);

    try {
      const text = await uploadAndExtractCv(file);
      setExtractedText(text);
    } catch (err) {
      setExtractedText(null);
      setExtractError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      multiple: false,
      disabled: isExtracting || isLoading,
    });

  /** Clear uploaded CV and any analysis tied to it */
  function handleClearCv() {
    setUploadedFileName(null);
    setExtractedText(null);
    setExtractError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisErrorRetryable(false);
    setSaveWarning(null);
    setSavedAnalysisId(null);
  }

  /**
   * Submit handler — sends parsed fields to /api/analyze-cv.
   */
  async function handleAnalyze() {
    if (!extractedText?.trim()) {
      setAnalysisError("Upload a CV PDF before analyzing.");
      return;
    }

    if (!jobDescription.trim()) {
      setAnalysisError("Paste a job description before analyzing.");
      return;
    }

    setIsLoading(true);
    setAnalysisError(null);
    setAnalysisErrorRetryable(false);
    setSaveWarning(null);
    setSavedAnalysisId(null);
    setAnalysisResult(null);

    const outcome = await analyzeCv({
      cvText: extractedText,
      jobRole: jobTitle,
      jobDescription,
    });

    if (!outcome.success) {
      setAnalysisError(outcome.error);
      setAnalysisErrorRetryable(outcome.retryable);
      setIsLoading(false);
      return;
    }

    setAnalysisResult(outcome.data);

    // Save to Supabase so it appears on the dashboard (non-blocking if save fails)
    const saveOutcome = await saveAnalysisToDatabase({
      cvText: extractedText,
      jobRole: jobTitle,
      atsScore: outcome.data.atsScore,
      fullAnalysis: outcome.data,
    });

    if (!saveOutcome.success) {
      setSaveWarning(saveOutcome.error);
    } else {
      setSavedAnalysisId(saveOutcome.id);
    }

    setIsLoading(false);
  }

  const canAnalyze =
    Boolean(extractedText?.trim()) &&
    Boolean(jobDescription.trim()) &&
    !isExtracting &&
    !isLoading;

  return (
    <div className="relative p-8">
      {/* Full-page loading overlay while Gemini runs */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-zinc-900">
            AI is analyzing your profile...
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Resume Analyzer
        </h1>
        <Badge variant="secondary">ATS analysis</Badge>
      </div>

      <div className="flex max-w-3xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Target role</CardTitle>
            <CardDescription>
              Choose the job title you are applying for.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="job-title" className="mb-2 block text-sm font-medium">
              Job title
            </label>
            <select
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value as JobTitle)}
              disabled={isLoading}
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {JOB_TITLES.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload your CV (PDF only)</CardTitle>
            <CardDescription>
              Drag a PDF here or click to browse. We extract the text so you can
              confirm it looks correct.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
                isDragActive && !isDragReject && "border-primary bg-primary/5",
                isDragReject && "border-destructive bg-destructive/5",
                !isDragActive &&
                  !isDragReject &&
                  "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30",
                (isExtracting || isLoading) &&
                  "pointer-events-none opacity-60"
              )}
            >
              <input {...getInputProps()} />
              {isExtracting ? (
                <>
                  <Loader2 className="size-10 animate-spin text-muted-foreground" />
                  <p className="text-sm font-medium">Extracting text from PDF…</p>
                </>
              ) : (
                <>
                  <Upload className="size-10 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {isDragActive
                        ? "Drop your PDF here"
                        : "Drag & drop your CV here, or click to select"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PDF only · Max 10 MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {isDragReject && (
              <p className="text-sm text-destructive">
                Only PDF files are accepted.
              </p>
            )}

            {uploadedFileName && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate">
                  <FileText className="size-4 shrink-0" />
                  {uploadedFileName}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCv}
                  disabled={isExtracting || isLoading}
                >
                  Remove
                </Button>
              </div>
            )}

            {extractError && (
              <p className="text-sm text-destructive" role="alert">
                {extractError}
              </p>
            )}
          </CardContent>
        </Card>

        {extractedText && (
          <Card>
            <CardHeader>
              <CardTitle>Extracted CV text</CardTitle>
              <CardDescription>
                Review the text below before running analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {extractedText}
              </pre>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
            <CardDescription>
              Paste the job posting you want to match against.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here…"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className="w-full sm:w-auto"
            >
              Analyze my CV
            </Button>
            {analysisError && (
              <div
                role="alert"
                className={cn(
                  "rounded-lg border px-4 py-3 text-sm",
                  analysisErrorRetryable
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                )}
              >
                <p className="font-medium">
                  {analysisErrorRetryable ? "Service temporarily unavailable" : "Analysis failed"}
                </p>
                <p className="mt-1">{analysisError}</p>
              </div>
            )}
            {saveWarning && (
              <div
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                {saveWarning}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results — shown after Gemini returns JSON */}
        {analysisResult && !isLoading && (
          <Card className="max-w-4xl">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle>Analysis results</CardTitle>
                <CardDescription>
                  ATS score and recommendations powered by Gemini
                </CardDescription>
              </div>
              {savedAnalysisId ? (
                <Link
                  href={`/reports/${savedAnalysisId}`}
                  className={cn(
                    buttonVariants(),
                    "no-print inline-flex shrink-0 items-center gap-2"
                  )}
                >
                  <FileBarChart className="size-4" />
                  Generate Report
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sign in and save to generate a report
                </p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview">
                <TabsList className="mb-4 flex h-auto w-full flex-wrap">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="skills">Missing skills</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="interview">Interview prep</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="flex flex-wrap items-end gap-4">
                    <p className="text-7xl font-bold tracking-tight">
                      {Math.round(analysisResult.atsScore)}
                    </p>
                    <div className="mb-2 flex flex-col gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        ATS Score
                      </span>
                      <Badge
                        className={cn(
                          "border px-3 py-1 text-sm",
                          getScoreBadgeStyle(analysisResult.atsScore)
                        )}
                      >
                        {getScoreLabel(analysisResult.atsScore)}
                      </Badge>
                    </div>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    {analysisResult.explanation}
                  </p>
                </TabsContent>

                <TabsContent value="skills" className="space-y-3">
                  {analysisResult.missingSkills.length === 0 ? (
                    <p className="text-muted-foreground">
                      No major skill gaps identified.
                    </p>
                  ) : (
                    analysisResult.missingSkills.map((skill) => (
                      <div
                        key={skill.name}
                        className="flex items-center justify-between rounded-lg border px-4 py-3"
                      >
                        <span className="font-medium">{skill.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            skill.importance === "high" &&
                              "border-red-200 bg-red-50 text-red-700",
                            skill.importance === "medium" &&
                              "border-amber-200 bg-amber-50 text-amber-700",
                            skill.importance === "low" &&
                              "border-zinc-200 bg-zinc-50 text-zinc-700"
                          )}
                        >
                          {skill.importance}
                        </Badge>
                      </div>
                    ))
                  )}
                </TabsContent>

                <TabsContent value="improvements" className="space-y-4">
                  {analysisResult.improvements.map((item, index) => (
                    <Card key={index} size="sm">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {item.suggestion}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="mb-1 font-medium text-muted-foreground">
                            Before
                          </p>
                          <p className="rounded-md bg-red-50 p-3 text-red-900">
                            {item.before}
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 font-medium text-muted-foreground">
                            After
                          </p>
                          <p className="rounded-md bg-green-50 p-3 text-green-900">
                            {item.after}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="interview" className="space-y-4">
                  {analysisResult.interviewQuestions.map((item, index) => (
                    <Card key={index} size="sm">
                      <CardHeader>
                        <CardTitle className="text-base">
                          Q{index + 1}. {item.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground">
                            Model answer:{" "}
                          </span>
                          {item.modelAnswer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
