import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import type { InterviewMessage } from "@/lib/interview-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.0-flash"];
const GROQ_MODEL    = "llama-3.3-70b-versatile";

export type InterviewStage =
  | "introduction"
  | "technical"
  | "behavioral"
  | "situational"
  | "closing"
  | "complete";

/* ── Prompts ── */
function buildSystemPrompt(jobRole: string, stage: InterviewStage): string {
  const stageInstructions: Record<InterviewStage, string> = {
    introduction: `
You are in the INTRODUCTION stage. Ask questions about:
- The candidate's background and career journey
- Why they want this specific role
- What they know about the current state of the industry
- Their most relevant recent experience
Ask warm, open-ended questions to put the candidate at ease.`,

    technical: `
You are in the TECHNICAL stage. Ask questions that reflect what companies are actually testing for ${jobRole} roles today. Focus on:
- Current tools, frameworks, and technologies used in ${jobRole} roles
- Real problem-solving scenarios specific to this role
- Recent industry trends and how the candidate keeps up with them
- Practical hands-on skills that employers prioritize right now
Make questions specific and challenging, not generic.`,

    behavioral: `
You are in the BEHAVIORAL stage. Use the STAR method format.
Ask about real situations the candidate has handled. Focus on:
- Collaboration and remote/hybrid team dynamics
- Handling ambiguity and rapid change
- Leadership and ownership of outcomes
- Conflict resolution and stakeholder management
Start questions with "Tell me about a time when..." or "Describe a situation where..."`,

    situational: `
You are in the SITUATIONAL stage. Present realistic hypothetical scenarios specific to ${jobRole}. Focus on:
- How they would handle current industry challenges
- Decision making under pressure
- Prioritization with limited resources
- Working with AI tools and automation
Start questions with "What would you do if..." or "How would you handle..."`,

    closing: `
You are in the CLOSING stage. This is where the candidate asks YOU questions.
Say something like: "We're nearing the end of our interview. Do you have any questions for me about the role, the team, or the company?"
Then answer their questions naturally as a knowledgeable interviewer would.
If they have no questions, wrap up warmly and tell them you'll be in touch.`,

    complete: `The interview is complete. Give a warm closing statement.`,
  };

  return `You are a senior hiring manager conducting a real job interview for: ${jobRole}.

CURRENT STAGE: ${stage.toUpperCase()}
${stageInstructions[stage]}

YOUR RULES — follow these strictly:
1. Ask exactly ONE question per message. Never ask two questions at once.
2. After the candidate answers, except in introduction stage, give brief feedback:
   - Start with "Feedback:" on a new line
   - One specific strength from their answer
   - One concrete improvement tip
   - Keep feedback to 2 sentences max
3. Then on a new line write "Next question:" and ask the next question.
4. For introduction stage, skip feedback and just ask the next question naturally.
5. Keep a professional but friendly tone.
6. Never repeat a question already asked.
7. Never mention being an AI or any AI service name.
8. Make the interview feel realistic, current, and role-specific.`;
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

/* ── Step 1 & 2: Try a single Gemini API key across all models ── */
async function tryGeminiKey(
  apiKey: string,
  keyLabel: string,
  messages: InterviewMessage[],
  jobRole: string,
  stage: InterviewStage
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
            systemInstruction: buildSystemPrompt(jobRole, stage),
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

/* ── Step 3: Groq fallback ── */
async function tryGroq(
  messages: InterviewMessage[],
  jobRole: string,
  stage: InterviewStage
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[interview] GROQ_API_KEY not configured — skipping Groq fallback");
    return null;
  }

  try {
    console.log("[interview] Trying Groq fallback");
    const groq = new Groq({ apiKey });

    /* Convert messages to Groq format */
    const groqMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: buildSystemPrompt(jobRole, stage),
      },
      ...messages.map((msg) => ({
        role: msg.role === "assistant"
          ? ("assistant" as const)
          : ("user" as const),
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
    return NextResponse.json(
      { error: "AI service is not configured." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as {
      jobRole?: string;
      messages?: InterviewMessage[];
      stage?: InterviewStage;
    };

    const jobRole  = body.jobRole?.trim();
    const messages = body.messages ?? [];
    const stage    = body.stage ?? getStageFromMessageCount(messages.length);

    if (!jobRole) {
      return NextResponse.json(
        { error: "Job role is required." },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Conversation history is required." },
        { status: 400 }
      );
    }

    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user." },
        { status: 400 }
      );
    }

    /* ── Step 1: Try Gemini key 1 ── */
    let reply = await tryGeminiKey(geminiKey1, "Gemini key 1", messages, jobRole, stage);

    /* ── Step 2: Try Gemini key 2 ── */
    if (!reply && geminiKey2) {
      reply = await tryGeminiKey(geminiKey2, "Gemini key 2", messages, jobRole, stage);
    }

    /* ── Step 3: Try Groq fallback ── */
    if (!reply) {
      reply = await tryGroq(messages, jobRole, stage);
    }

    /* ── Step 4: All providers failed ── */
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