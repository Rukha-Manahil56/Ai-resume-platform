import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { InterviewMessage } from "@/lib/interview-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

/* Switched to 1.5-flash — higher free tier limits (1500 req/day, 15/min) */
const GEMINI_MODEL = "gemini-2.0-flash";

export type InterviewStage =
  | "introduction"
  | "technical"
  | "behavioral"
  | "situational"
  | "closing"
  | "complete";

function buildSystemPrompt(jobRole: string, stage: InterviewStage): string {
  const stageInstructions: Record<InterviewStage, string> = {
    introduction: `
You are in the INTRODUCTION stage. Ask questions about:
- The candidate's background and career journey
- Why they want this specific role in 2026
- What they know about the current state of the industry
- Their most relevant recent experience
Ask warm, open-ended questions to put the candidate at ease.`,

    technical: `
You are in the TECHNICAL stage. Ask questions that reflect what companies are 
actually testing for ${jobRole} roles in 2026. Focus on:
- Current tools, frameworks, and technologies used in ${jobRole} roles today
- Real problem-solving scenarios specific to this role
- Recent industry trends and how the candidate keeps up with them
- Practical hands-on skills that employers prioritize right now
Make questions specific and challenging, not generic.`,

    behavioral: `
You are in the BEHAVIORAL stage. Use the STAR method format.
Ask about real situations the candidate has handled. Focus on:
- Collaboration and remote/hybrid team dynamics (very relevant in 2026)
- Handling ambiguity and rapid change
- Leadership and ownership of outcomes
- Conflict resolution and stakeholder management
Start questions with "Tell me about a time when..." or "Describe a situation where..."`,

    situational: `
You are in the SITUATIONAL stage. Present realistic hypothetical scenarios 
specific to ${jobRole} in 2026. Focus on:
- How they would handle current industry challenges
- Decision making under pressure
- Prioritization with limited resources
- Working with AI tools and automation (a key reality in 2026)
Start questions with "What would you do if..." or "How would you handle..."`,

    closing: `
You are in the CLOSING stage. This is where the candidate asks YOU questions.
Say something like: "We're nearing the end of our interview. 
Do you have any questions for me about the role, the team, or the company?"
Then answer their questions naturally as a knowledgeable interviewer would.
If they have no questions, wrap up warmly and tell them you'll be in touch.`,

    complete: `The interview is complete. Give a warm closing statement.`,
  };

  return `You are a senior hiring manager conducting a real job interview for: ${jobRole} in 2026.

CURRENT STAGE: ${stage.toUpperCase()}
${stageInstructions[stage]}

YOUR RULES — follow these strictly:
1. Ask exactly ONE question per message. Never ask two questions at once.
2. After the candidate answers (except in introduction stage), give brief feedback:
   - Start with "Feedback:" on a new line
   - One specific strength from their answer
   - One concrete improvement tip
   - Keep feedback to 2 sentences max
3. Then on a new line write "Next question:" and ask the next question
4. For introduction stage, skip the feedback and just ask the next question naturally
5. Keep a professional but friendly tone
6. Never repeat a question already asked
7. Never mention being an AI or any AI service name
8. Base your questions on what hiring managers at top companies actually ask in 2026
9. Make the interview feel real and current — reference actual tools, trends, and challenges of 2026`;
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

/** Wait for a given number of milliseconds */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Last message must be from the user." },
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
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: buildSystemPrompt(jobRole, stage),
            temperature: 0.75,
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
        /* Non-retryable error — throw immediately */
        throw err;
      }
    }

    if (!response) throw lastError;

    const reply = response.text?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "Empty response from AI." },
        { status: 502 }
      );
    }

    const nextStage = getStageFromMessageCount(messages.length + 1);

    return NextResponse.json({ reply, stage: nextStage });

  } catch (error) {
    console.error("[interview]", error);
    const { status, body } = mapGeminiError(
      error,
      "The AI interviewer is busy right now. Please wait a moment and try again."
    );
    return NextResponse.json(body, { status });
  }
}