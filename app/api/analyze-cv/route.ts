import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import type { CvAnalysisResult } from "@/lib/analysis-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

/* Switched to 1.5-flash — higher free tier limits */
const GEMINI_MODEL = "gemini-2.0-flash";

const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    atsScore: {
      type: "number",
      description: "ATS match score from 0 to 100",
    },
    explanation: {
      type: "string",
      description: "One paragraph explaining the score",
    },
    missingSkills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name:       { type: "string" },
          importance: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["name", "importance"],
      },
    },
    improvements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          suggestion: { type: "string" },
          before:     { type: "string" },
          after:      { type: "string" },
        },
        required: ["suggestion", "before", "after"],
      },
      minItems: 5,
      maxItems: 5,
    },
    interviewQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question:    { type: "string" },
          modelAnswer: { type: "string" },
        },
        required: ["question", "modelAnswer"],
      },
      minItems: 8,
      maxItems: 8,
    },
  },
  required: [
    "atsScore",
    "explanation",
    "missingSkills",
    "improvements",
    "interviewQuestions",
  ],
} as const;

function buildAnalysisPrompt(
  cvText: string,
  jobRole: string,
  jobDescription: string
): string {
  return `You are an advanced Applicant Tracking System (ATS) engine.

Analyze how well the candidate's CV matches the target role and job description.
Be specific, practical, and honest. Base missing skills on the job description.
For improvements, quote realistic "before" snippets from the CV and show stronger "after" versions.
For interview questions, tailor them to the role and the candidate's background.

Return ONLY valid JSON matching the required schema.

TARGET ROLE: ${jobRole}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV TEXT:
${cvText}`;
}

function parseAnalysisResult(raw: string): CvAnalysisResult {
  const parsed = JSON.parse(raw) as CvAnalysisResult;

  if (
    typeof parsed.atsScore !== "number" ||
    parsed.atsScore < 0 ||
    parsed.atsScore > 100
  ) throw new Error("Invalid atsScore in model response.");

  if (typeof parsed.explanation !== "string" || !parsed.explanation.trim())
    throw new Error("Invalid explanation in model response.");

  if (!Array.isArray(parsed.missingSkills))
    throw new Error("Invalid missingSkills in model response.");

  if (!Array.isArray(parsed.improvements) || parsed.improvements.length !== 5)
    throw new Error("Expected exactly 5 improvements.");

  if (
    !Array.isArray(parsed.interviewQuestions) ||
    parsed.interviewQuestions.length !== 8
  ) throw new Error("Expected exactly 8 interview questions.");

  return parsed;
}

/** Wait for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      cvText?: string;
      jobRole?: string;
      jobDescription?: string;
    };

    const cvText         = body.cvText?.trim();
    const jobRole        = body.jobRole?.trim();
    const jobDescription = body.jobDescription?.trim();

    if (!cvText) {
      return NextResponse.json(
        { error: "CV text is required. Upload a PDF first." },
        { status: 400 }
      );
    }

    if (!jobRole) {
      return NextResponse.json(
        { error: "Job role is required." },
        { status: 400 }
      );
    }

    if (!jobDescription) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    /* ── Retry logic — up to 3 attempts on 429/503 ── */
    let response;
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: buildAnalysisPrompt(cvText, jobRole, jobDescription),
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        });
        break; /* success — exit retry loop */
      } catch (err: unknown) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        if (status === 429 || status === 503) {
          /* Wait 2s before first retry, 4s before second */
          await sleep((attempt + 1) * 2000);
          continue;
        }
        throw err;
      }
    }

    if (!response) throw lastError;

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    const result = parseAnalysisResult(text);
    return NextResponse.json(result);

  } catch (error) {
    console.error("[analyze-cv]", error);
    const { status, body } = mapGeminiError(
      error,
      "Analysis failed. The AI is busy — please wait a moment and try again.",
      GEMINI_MODEL
    );
    return NextResponse.json(body, { status });
  }
}