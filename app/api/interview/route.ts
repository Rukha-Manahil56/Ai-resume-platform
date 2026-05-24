import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

import type { InterviewMessage } from "@/lib/interview-types";
import { mapGeminiError } from "@/lib/map-gemini-error";

export const runtime = "nodejs";

const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Instructions that tell Gemini how to behave as an interviewer.
 */
function buildInterviewerSystemPrompt(jobRole: string): string {
  return `You are a professional job interviewer conducting a live mock interview for the role: ${jobRole}.

Your rules:
- Ask ONE question at a time. Never ask multiple questions in a single message.
- After the candidate answers, give a brief evaluation (1-2 sentences): one strength and one concrete improvement tip.
- Then ask the next interview question on a new line or after the evaluation.
- Mix behavioral questions ("Tell me about a time when...") and role-specific questions for ${jobRole}.
- Keep a warm, professional tone. Be concise — aim for 3-5 sentences total per reply.
- Do not repeat questions already asked in the conversation.
- Do not invent facts about the candidate; only respond to what they said.
- Stay in character as the interviewer. Do not mention being an AI.`;
}

/**
 * Convert our chat messages into the format Gemini expects (user / model roles).
 */
function toGeminiContents(messages: InterviewMessage[]) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.content }],
  }));
}

/**
 * POST /api/interview
 * Body: { jobRole, messages } — full conversation including the latest user answer.
 * Returns: { reply } — the interviewer's next message.
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
      jobRole?: string;
      messages?: InterviewMessage[];
    };

    const jobRole = body.jobRole?.trim();
    const messages = body.messages ?? [];

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
        { error: "The last message must be from the candidate (user)." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: buildInterviewerSystemPrompt(jobRole),
        temperature: 0.7,
      },
    });

    const reply = response.text?.trim();

    if (!reply) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[interview]", error);
    const { status, body } = mapGeminiError(
      error,
      "Failed to get interviewer response. Please try again."
    );
    return NextResponse.json(body, { status });
  }
}
