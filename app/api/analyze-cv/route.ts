import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import type { CvAnalysisResult } from "@/lib/analysis-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

/** Gemini model used for ATS analysis */
const GEMINI_MODEL = "gemini-2.5-flash";

/** JSON Schema sent to Gemini so the model returns predictable structure */
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
          name: { type: "string" },
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
          before: { type: "string" },
          after: { type: "string" },
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
          question: { type: "string" },
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

/**
 * Build the system + user prompt that tells Gemini how to score the CV.
 */
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

/**
 * Parse and validate the model's JSON so the client always gets safe data.
 */
function parseAnalysisResult(raw: string): CvAnalysisResult {
  const parsed = JSON.parse(raw) as CvAnalysisResult;

  if (
    typeof parsed.atsScore !== "number" ||
    parsed.atsScore < 0 ||
    parsed.atsScore > 100
  ) {
    throw new Error("Invalid atsScore in model response.");
  }

  if (typeof parsed.explanation !== "string" || !parsed.explanation.trim()) {
    throw new Error("Invalid explanation in model response.");
  }

  if (!Array.isArray(parsed.missingSkills)) {
    throw new Error("Invalid missingSkills in model response.");
  }

  if (!Array.isArray(parsed.improvements) || parsed.improvements.length !== 5) {
    throw new Error("Expected exactly 5 improvements.");
  }

  if (
    !Array.isArray(parsed.interviewQuestions) ||
    parsed.interviewQuestions.length !== 8
  ) {
    throw new Error("Expected exactly 8 interview questions.");
  }

  return parsed;
}

/**
 * POST /api/analyze-cv
 * Body: { cvText, jobRole, jobDescription }
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      cvText?: string;
      jobRole?: string;
      jobDescription?: string;
    };

    const cvText = body.cvText?.trim();
    const jobRole = body.jobRole?.trim();
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

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildAnalysisPrompt(cvText, jobRole, jobDescription),
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.4,
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    const result = parseAnalysisResult(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[analyze-cv]", error);
    const { status, body } = mapGeminiError(
      error,
      "Failed to analyze CV. Please try again.",
      GEMINI_MODEL
    );
    return NextResponse.json(body, { status });
  }
}
