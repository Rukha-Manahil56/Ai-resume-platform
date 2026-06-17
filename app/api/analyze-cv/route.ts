import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import type { CvAnalysisResult } from "@/lib/analysis-types";
import { mapGeminiError } from "@/lib/map-gemini-error";
import { createHash } from "crypto";

export const runtime = "nodejs";

/* ── Models ── */
const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
const GROQ_MODEL    = "llama-3.3-70b-versatile";

/* ── Response schema for Gemini ── */
const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    atsScore:    { type: "number", description: "ATS match score 0–100" },
    explanation: { type: "string", description: "One paragraph explaining the score" },
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
    "atsScore", "explanation", "missingSkills",
    "improvements", "interviewQuestions",
  ],
} as const;

/* ── Helpers ── */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const status  = (error as { status?: number })?.status;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    status === 429 ||
    status === 503 ||
    message.includes("overloaded") ||
    message.includes("unavailable") ||
    message.includes("resource exhausted") ||
    message.includes("too many requests") ||
    message.includes("quota")
  );
}

/*
 * Task 6 — buildPrompt
 *
 * The prompt now explicitly instructs the AI to generate interview questions
 * that are PERSONALIZED to this specific candidate. Questions must be derived
 * from a combination of:
 *   • The candidate's actual CV content (skills, projects, experience, education)
 *   • The selected job role (domain-specific focus)
 *   • The job description (employer's exact requirements and keywords)
 *   • Missing skills identified during analysis (probe on gaps)
 *   • Experience level inferred from the CV
 *
 * Generic, hardcoded, or role-agnostic questions are explicitly forbidden.
 */
function buildPrompt(cvText: string, jobRole: string, jobDescription: string): string {
  return `You are an advanced Applicant Tracking System (ATS) engine and senior hiring expert.

Analyze how well the candidate's CV matches the target role and job description.
Be specific, practical, and honest. Base missing skills strictly on the job description.
For improvements, quote realistic "before" snippets from the CV and show stronger "after" versions.

──────────────────────────────────────────
INTERVIEW QUESTIONS — CRITICAL INSTRUCTIONS
──────────────────────────────────────────
Generate exactly 8 interview questions that are COMPLETELY PERSONALIZED to THIS candidate.

You MUST:
1. Read the candidate's CV carefully — note their actual skills, tools, projects, job titles,
   years of experience, education, and any achievements they mention.
2. Read the job description carefully — note the employer's required skills, responsibilities,
   and keywords.
3. Generate questions that directly reference or probe what you found in the CV and job
   description. For example:
     - If the CV mentions "React" and the job requires "Next.js", ask about their transition
       or experience with SSR/SSG.
     - If the CV lists a specific project, ask a question about a challenge from that project.
     - If the CV shows 2 years of experience but the job asks for 5, ask how they plan to
       close that gap.
     - If a skill appears in the job description but is absent from the CV, ask how the
       candidate would approach learning it.
4. Cover a mix of question types across the 8 questions:
     - At least 2 TECHNICAL questions specific to the ${jobRole} role and the candidate's
       tech stack or domain.
     - At least 2 BEHAVIORAL questions (STAR format) that reference the candidate's actual
       background.
     - At least 1 SITUATIONAL question based on a realistic scenario for this exact role.
     - At least 1 question probing a KEY MISSING SKILL or gap identified in the analysis.
     - Remaining questions tailored to the candidate's career level and the role's seniority.
5. Write a strong, specific modelAnswer for each question — the answer should reference the
   candidate's own background where possible, and show what an excellent answer looks like.

You MUST NOT:
- Generate generic questions like "Tell me about yourself" or "Where do you see yourself
  in 5 years" unless they are deeply customized to this candidate's specific situation.
- Copy the same questions across different candidates or roles.
- Produce questions that could apply to any candidate regardless of their CV.
- Hardcode questions for specific job titles. The role is a GUIDE for domain focus only —
  the questions must come from the CV content and job description.

──────────────────────────────────────────

Return ONLY valid JSON matching the required schema.

TARGET ROLE: ${jobRole}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE CV TEXT:
${cvText}`;
}

function parseResult(raw: string): CvAnalysisResult {
  const parsed = JSON.parse(raw) as CvAnalysisResult;

  if (typeof parsed.atsScore !== "number" || parsed.atsScore < 0 || parsed.atsScore > 100)
    throw new Error("Invalid atsScore.");

  if (typeof parsed.explanation !== "string" || !parsed.explanation.trim())
    throw new Error("Invalid explanation.");

  if (!Array.isArray(parsed.missingSkills))
    throw new Error("Invalid missingSkills.");

  if (!Array.isArray(parsed.improvements) || parsed.improvements.length !== 5)
    throw new Error("Expected exactly 5 improvements.");

  if (!Array.isArray(parsed.interviewQuestions) || parsed.interviewQuestions.length !== 8)
    throw new Error("Expected exactly 8 interview questions.");

  return parsed;
}

function makeCacheKey(cvText: string, jobRole: string, jobDescription: string): string {
  return createHash("sha256")
    .update(`${cvText}||${jobRole}||${jobDescription}`)
    .digest("hex")
    .slice(0, 32);
}

/* ── Step 1: Check Supabase cache ── */
async function checkCache(cacheKey: string): Promise<CvAnalysisResult | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("analysis_cache")
      .select("result")
      .eq("cache_key", cacheKey)
      .single();

    if (error || !data) return null;
    console.log("[analyze-cv] Cache hit — returning cached result");
    return data.result as CvAnalysisResult;
  } catch {
    return null;
  }
}

/* ── Step 5: Save result to Supabase cache ── */
async function saveToCache(
  cacheKey: string,
  cvText: string,
  jobRole: string,
  result: CvAnalysisResult
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("analysis_cache").upsert({
      cache_key:  cacheKey,
      job_role:   jobRole,
      cv_preview: cvText.slice(0, 200),
      result,
      created_at: new Date().toISOString(),
    });
    console.log("[analyze-cv] Result saved to cache");
  } catch (err) {
    console.warn("[analyze-cv] Cache save failed (non-critical):", err);
  }
}

/* ── Steps 2 & 3: Try Gemini keys ── */
async function tryGemini(
  prompt: string,
  apiKey: string,
  keyLabel: string
): Promise<CvAnalysisResult | null> {
  const ai = new GoogleGenAI({ apiKey });

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[analyze-cv] ${keyLabel} — model ${modelName}, attempt ${attempt + 1}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
            temperature: 0.4,
          },
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from AI.");

        const result = parseResult(text);
        console.log(`[analyze-cv] Success — ${keyLabel}, model ${modelName}`);
        return result;

      } catch (err) {
        if (isRetryable(err)) {
          console.warn(`[analyze-cv] ${keyLabel} ${modelName} busy, retrying ${attempt + 1}/3`);
          await sleep((attempt + 1) * 2000);
          continue;
        }
        console.warn(`[analyze-cv] ${keyLabel} ${modelName} failed:`, err);
        break;
      }
    }
  }

  return null;
}

/* ── Step 4: Groq fallback ── */
async function tryGroq(
  cvText: string,
  jobRole: string,
  jobDescription: string
): Promise<CvAnalysisResult | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[analyze-cv] GROQ_API_KEY not configured — skipping Groq fallback");
    return null;
  }

  try {
    console.log("[analyze-cv] Trying Groq fallback");
    const groq = new Groq({ apiKey });

    const prompt = `${buildPrompt(cvText, jobRole, jobDescription)}

IMPORTANT: Return ONLY a valid JSON object. No markdown, no code blocks, no explanation.
The JSON must have exactly these fields:
- atsScore: number (0-100)
- explanation: string (one paragraph)
- missingSkills: array of {name: string, importance: "high"|"medium"|"low"}
- improvements: array of exactly 5 {suggestion: string, before: string, after: string}
- interviewQuestions: array of exactly 8 {question: string, modelAnswer: string}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4096,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("Empty response from Groq");

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/,      "")
      .replace(/\s*```$/,      "")
      .trim();

    const result = parseResult(cleaned);
    console.log("[analyze-cv] Groq fallback success");
    return result;

  } catch (err) {
    console.error("[analyze-cv] Groq fallback failed:", err);
    return null;
  }
}

/* ── Main handler ── */
export async function POST(request: NextRequest) {
  const geminiKey1 = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI_API_KEY_2;

  if (!geminiKey1) {
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
      return NextResponse.json({ error: "CV text is required. Upload a PDF first." }, { status: 400 });
    }
    if (!jobRole) {
      return NextResponse.json({ error: "Job role is required." }, { status: 400 });
    }
    if (!jobDescription) {
      return NextResponse.json({ error: "Job description is required." }, { status: 400 });
    }

    const prompt   = buildPrompt(cvText, jobRole, jobDescription);
    const cacheKey = makeCacheKey(cvText, jobRole, jobDescription);

    /* Step 1: Check cache */
    const cached = await checkCache(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true });
    }

    /* Step 2: Try Gemini key 1 */
    let result = await tryGemini(prompt, geminiKey1, "Gemini key 1");

    /* Step 3: Try Gemini key 2 */
    if (!result && geminiKey2) {
      result = await tryGemini(prompt, geminiKey2, "Gemini key 2");
    }

    /* Step 4: Try Groq fallback */
    if (!result) {
      result = await tryGroq(cvText, jobRole, jobDescription);
    }

    /* All providers failed */
    if (!result) {
      return NextResponse.json(
        {
          error: "Our AI service is experiencing very high demand right now. Please wait 30 seconds and try again.",
          retryable: true,
        },
        { status: 503 }
      );
    }

    /* Step 5: Save to cache */
    void saveToCache(cacheKey, cvText, jobRole, result);

    return NextResponse.json(result);

  } catch (error) {
    console.error("[analyze-cv]", error);
    const { status, body } = mapGeminiError(
      error,
      "Analysis failed. Please try again in a moment.",
      GEMINI_MODELS[0]
    );
    return NextResponse.json(body, { status });
  }
}