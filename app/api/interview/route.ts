import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import type { InterviewMessage } from "@/lib/interview-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
const GROQ_MODEL    = "gpt-oss-120b";

export type InterviewStage =
  | "introduction"
  | "technical"
  | "behavioral"
  | "situational"
  | "closing"
  | "complete";

/*
 * Task 6 — buildSystemPrompt
 *
 * The system prompt now explicitly instructs the AI to personalize every
 * question using the candidate's CV data (skills, projects, experience,
 * tools) and the job description. Generic questions are forbidden.
 *
 * The cvText and jobDescription are passed into the prompt so the AI has
 * full context at every stage of the conversation.
 */
function buildSystemPrompt(
  jobRole: string,
  stage: InterviewStage,
  cvText: string,
  jobDescription: string
): string {
  const stageInstructions: Record<InterviewStage, string> = {
    introduction: `
You are in the INTRODUCTION stage.
Read the candidate's CV carefully before asking anything.
Ask warm, open-ended questions that are SPECIFIC to this candidate — reference their actual
background, career transitions, or interesting details you notice in their CV.
For example, if they changed industries, ask about that. If they have an unusual career path,
ask about it. Do NOT ask generic openers like "Tell me about yourself" without anchoring it
to something specific in their profile.`,

    technical: `
You are in the TECHNICAL stage.
Read the candidate's CV and the job description carefully.
Ask TECHNICAL questions that are directly relevant to:
  - Technologies, tools, or frameworks the candidate actually lists on their CV
  - Skills required by the job description that the candidate may or may not have
  - Gaps between what the candidate knows and what the role requires
  - Real problem-solving scenarios a ${jobRole} faces day-to-day in this specific context

Examples of personalized technical questions:
  - "I see you've used [tool from CV] — how would you approach [scenario from job description]?"
  - "The role requires [skill from JD] but I don't see it on your CV — how would you handle that?"
  - "You mentioned [project from CV] — what was the biggest technical challenge and how did you solve it?"

Make questions challenging, specific, and impossible to answer without knowing this candidate's
actual background. Never ask a generic technical question that any developer could answer.`,

    behavioral: `
You are in the BEHAVIORAL stage. Use the STAR method format.
Base your questions on ACTUAL EXPERIENCES visible in the candidate's CV.
Reference their past roles, projects, or skills explicitly.
For example:
  - "You worked at [company from CV] as [role from CV] — tell me about a time when..."
  - "I see you led [project/team detail from CV] — describe a situation where..."
  - "Given your background in [domain from CV], how did you handle..."

Do NOT ask generic behavioral questions. Every question must anchor to a specific detail
in this candidate's CV or career history.`,

    situational: `
You are in the SITUATIONAL stage.
Present realistic hypothetical scenarios that are SPECIFIC to both the ${jobRole} position
and this candidate's experience level as shown in their CV.
Adjust difficulty and complexity to match how senior/junior they appear from the CV.
Reference their domain, industry, or tools where relevant.
Example: "If you were brought in as a ${jobRole} at a company using [tech from JD], 
but the existing codebase relied heavily on [something different from CV], how would 
you approach..."`,

    closing: `
You are in the CLOSING stage.
This is where the candidate asks YOU questions.
Say something like: "We're nearing the end of our interview. Do you have any questions for me 
about the role, the team, or the company?"
Then answer their questions naturally as a knowledgeable interviewer would, using context
from the job description where appropriate.
If they have no questions, wrap up warmly and tell them you'll be in touch.`,

    complete: `The interview is complete. Give a warm, personalized closing statement that
references something specific and positive you noticed about this candidate.`,
  };

  return `You are a senior hiring manager conducting a real job interview for: ${jobRole}.

CURRENT STAGE: ${stage.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CANDIDATE BACKGROUND (from their CV):
${cvText || "No CV provided — ask general role-specific questions."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
JOB DESCRIPTION:
${jobDescription || "No job description provided — focus on standard ${jobRole} requirements."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STAGE INSTRUCTIONS:
${stageInstructions[stage]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR STRICT RULES — follow these without exception:

1. Ask exactly ONE question per message. Never ask two questions at once.

2. PERSONALIZATION IS MANDATORY: Every question must be grounded in something
   specific from the candidate's CV or the job description. Never ask a question
   that could apply to any random candidate regardless of their background.

3. After the candidate answers (except introduction stage), give brief feedback:
   - Start with "Feedback:" on a new line
   - One specific strength from their answer
   - One concrete improvement tip
   - Keep feedback to 2 sentences max

4. Then on a new line write "Next question:" and ask the next personalized question.

5. For introduction stage, skip the feedback and ask the next question naturally.

6. Keep a professional but friendly tone.

7. Never repeat a question already asked in this conversation.

8. Never mention being an AI or any AI service name.

9. Make the interview feel realistic, current, and completely tailored to this individual.`;
}

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

function toGeminiContents(messages: InterviewMessage[]) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));
}

function getStageFromMessageCount(count: number): InterviewStage {
  if (count <= 4)  return "introduction";
  if (count <= 10) return "technical";
  if (count <= 16) return "behavioral";
  if (count <= 20) return "situational";
  if (count <= 24) return "closing";
  return "complete";
}

/* ── Try a single Gemini API key ── */
async function tryGeminiKey(
  apiKey: string,
  keyLabel: string,
  messages: InterviewMessage[],
  jobRole: string,
  stage: InterviewStage,
  cvText: string,
  jobDescription: string
): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey });

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`[interview] ${keyLabel} — model ${modelName}, attempt ${attempt + 1}`);

        const response = await ai.models.generateContent({
          model: modelName,
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: buildSystemPrompt(jobRole, stage, cvText, jobDescription),
            temperature: 0.75,
          },
        });

        const reply = response.text?.trim();
        if (!reply) throw new Error("Empty response from AI.");

        console.log(`[interview] Success — ${keyLabel}, model ${modelName}`);
        return reply;

      } catch (err) {
        if (isRetryable(err)) {
          console.warn(`[interview] ${keyLabel} ${modelName} busy, retrying ${attempt + 1}/3`);
          await sleep((attempt + 1) * 2000);
          continue;
        }
        console.warn(`[interview] ${keyLabel} ${modelName} failed:`, err);
        break;
      }
    }
  }

  return null;
}

/* ── Groq fallback ── */
async function tryGroq(
  messages: InterviewMessage[],
  jobRole: string,
  stage: InterviewStage,
  cvText: string,
  jobDescription: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[interview] GROQ_API_KEY not configured — skipping Groq fallback");
    return null;
  }

  try {
    console.log("[interview] Trying Groq fallback");
    const groq = new Groq({ apiKey });

    const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: buildSystemPrompt(jobRole, stage, cvText, jobDescription),
      },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: msg.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature: 0.75,
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) throw new Error("Empty response from Groq");

    console.log("[interview] Groq fallback success");
    return reply;

  } catch (err) {
    console.error("[interview] Groq fallback failed:", err);
    return null;
  }
}

/* ── Main handler ── */
export async function POST(request: NextRequest) {
  const geminiKey1 = process.env.GEMINI_API_KEY;
  const geminiKey2 = process.env.GEMINI_API_KEY_2;

  if (!geminiKey1) {
    return NextResponse.json({ error: "AI service is not configured." }, { status: 500 });
  }

  try {
    const body = (await request.json()) as {
      jobRole?: string;
      messages?: InterviewMessage[];
      stage?: InterviewStage;
      /*
       * Task 6: The frontend should now pass cvText and jobDescription through
       * to the interview API so the AI can personalize every question.
       * Both fields are optional — if absent, the AI falls back to role-general questions.
       */
      cvText?: string;
      jobDescription?: string;
    };

    const jobRole        = body.jobRole?.trim() ?? "";
    const messages       = body.messages ?? [];
    const stage          = body.stage ?? getStageFromMessageCount(messages.length);
    const cvText         = body.cvText?.trim() ?? "";
    const jobDescription = body.jobDescription?.trim() ?? "";

    if (!jobRole) {
      return NextResponse.json({ error: "Job role is required." }, { status: 400 });
    }
    if (messages.length === 0) {
      return NextResponse.json({ error: "Conversation history is required." }, { status: 400 });
    }
    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Last message must be from the user." }, { status: 400 });
    }

    /* Step 1: Try Gemini key 1 */
    let reply = await tryGeminiKey(geminiKey1, "Gemini key 1", messages, jobRole, stage, cvText, jobDescription);

    /* Step 2: Try Gemini key 2 */
    if (!reply && geminiKey2) {
      reply = await tryGeminiKey(geminiKey2, "Gemini key 2", messages, jobRole, stage, cvText, jobDescription);
    }

    /* Step 3: Try Groq fallback */
    if (!reply) {
      reply = await tryGroq(messages, jobRole, stage, cvText, jobDescription);
    }

    /* All providers failed */
    if (!reply) {
      return NextResponse.json(
        {
          error: "Our interview AI is experiencing very high demand right now. Please wait 30 seconds and try again.",
          retryable: true,
        },
        { status: 503 }
      );
    }

    const nextStage = getStageFromMessageCount(messages.length + 1);
    return NextResponse.json({ reply, stage: nextStage });

  } catch (error) {
    console.error("[interview]", error);
    const { status, body } = mapGeminiError(
      error,
      "Interview session failed. Please try again in a moment.",
      GEMINI_MODELS[0]
    );
    return NextResponse.json(body, { status });
  }
}
