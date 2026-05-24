"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Ten common job titles for the dropdown */
const JOB_TITLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Project Manager",
  "Business Analyst",
  "DevOps Engineer",
  "Human Resources Specialist",
] as const;

type JobTitle = (typeof JOB_TITLES)[number];

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

// Route: /resume-analyzer
export default function ResumeAnalyzerPage() {
  const [jobTitle, setJobTitle] = useState<JobTitle>(JOB_TITLES[0]);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Called by react-dropzone when the user drops a file or picks one from the dialog.
   * We only accept one PDF, then call the API to extract its text.
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setExtractedText(null);
    setUploadedFileName(file.name);
    setIsExtracting(true);

    try {
      const text = await uploadAndExtractCv(file);
      setExtractedText(text);
    } catch (err) {
      setExtractedText(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsExtracting(false);
    }
  }, []);

  /**
   * Configure the drag-and-drop zone: PDF only, single file.
   * getRootProps / getInputProps must be spread onto the drop zone elements.
   */
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      maxFiles: 1,
      multiple: false,
      disabled: isExtracting,
    });

  /**
   * Clear the CV upload state so the user can try another file.
   */
  function handleClearCv() {
    setUploadedFileName(null);
    setExtractedText(null);
    setError(null);
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Resume Analyzer
        </h1>
        <Badge variant="secondary">Step 1 — Upload CV</Badge>
      </div>

      <div className="flex max-w-3xl flex-col gap-6">
        {/* Job title dropdown */}
        <Card>
          <CardHeader>
            <CardTitle>Target role</CardTitle>
            <CardDescription>
              Choose the job title you are applying for. This will be used for
              matching later.
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
              className="flex h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {JOB_TITLES.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* PDF drag-and-drop upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload your CV (PDF only)</CardTitle>
            <CardDescription>
              Drag a PDF here or click to browse. We will extract the text so you
              can confirm it looks correct.
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
                isExtracting && "pointer-events-none opacity-60"
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
                  disabled={isExtracting}
                >
                  Remove
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Extracted CV text preview */}
        {extractedText && (
          <Card>
            <CardHeader>
              <CardTitle>Extracted CV text</CardTitle>
              <CardDescription>
                Review the text below. If anything looks wrong, try re-uploading a
                different PDF or a cleaner export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                {extractedText}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Job description paste area */}
        <Card>
          <CardHeader>
            <CardTitle>Job description</CardTitle>
            <CardDescription>
              Paste the job posting here. In a later step, we will compare it to
              your CV.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="job-description" className="sr-only">
              Job description
            </label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here…"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
