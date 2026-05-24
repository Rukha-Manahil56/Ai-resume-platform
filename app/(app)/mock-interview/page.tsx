"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  GEMINI_BUSY_MESSAGE,
  type AnalyzeCvErrorResponse,
} from "@/lib/gemini-errors";
import type { InterviewMessage } from "@/lib/interview-types";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import { cn } from "@/lib/utils";

/** First question the interviewer always asks */
const OPENING_QUESTION = "Tell me about yourself.";

type InterviewOutcome =
  | { success: true; reply: string }
  | { success: false; error: string };

/**
 * Create a unique id for each chat message (used as React key).
 */
function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Call our API route to get the interviewer's next reply.
 * Returns a result object instead of throwing so the UI never crashes.
 */
async function fetchInterviewerReply(
  jobRole: string,
  messages: InterviewMessage[]
): Promise<InterviewOutcome> {
  try {
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole, messages }),
    });

    let data: { reply?: string } & AnalyzeCvErrorResponse | null = null;

    try {
      data = await response.json();
    } catch {
      return {
        success: false,
        error: "Unexpected server response. Please try again.",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error:
          data?.error ??
          (response.status === 503 || response.status === 429
            ? GEMINI_BUSY_MESSAGE
            : "Could not get a response. Please try again."),
      };
    }

    if (!data?.reply?.trim()) {
      return { success: false, error: "Empty reply from interviewer." };
    }

    return { success: true, reply: data.reply };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE };
  }
}

// Route: /mock-interview
export default function MockInterviewPage() {
  const [jobRole, setJobRole] = useState<JobTitle>(JOB_TITLES[0]);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Scroll the chat to the newest message whenever the list updates.
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /**
   * Begin the interview with the standard opening question (no API call needed).
   */
  function handleStartInterview() {
    setInterviewStarted(true);
    setError(null);
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: OPENING_QUESTION,
      },
    ]);
    setInput("");
  }

  /**
   * Reset the chat so the user can pick a new role and start over.
   */
  function handleResetInterview() {
    setInterviewStarted(false);
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
  }

  /**
   * Send the user's answer to the API and append the interviewer's reply.
   */
  async function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !interviewStarted) return;

    const userMessage: InterviewMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const historyWithUser = [...messages, userMessage];
    setMessages(historyWithUser);
    setInput("");
    setError(null);
    setIsLoading(true);

    const outcome = await fetchInterviewerReply(jobRole, historyWithUser);

    if (!outcome.success) {
      // Put the typed answer back so the user can retry without retyping
      setMessages(messages);
      setInput(trimmed);
      setError(outcome.error);
      setIsLoading(false);
      return;
    }

    setMessages([
      ...historyWithUser,
      {
        id: createMessageId(),
        role: "assistant",
        content: outcome.reply,
      },
    ]);
    setIsLoading(false);
    textareaRef.current?.focus();
  }

  /**
   * Allow Enter to send (Shift+Enter adds a new line).
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  }

  const canSend = interviewStarted && Boolean(input.trim()) && !isLoading;

  return (
    <div className="flex min-h-[calc(100dvh-1rem)] flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Mock Interview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice with an AI interviewer powered by Gemini
        </p>
      </div>

      {/* Job role selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Interview role</CardTitle>
          <CardDescription>
            Questions will be tailored to this position
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="interview-role" className="sr-only">
              Job role
            </label>
            <select
              id="interview-role"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value as JobTitle)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              {JOB_TITLES.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
          {!interviewStarted ? (
            <Button type="button" onClick={handleStartInterview}>
              Start interview
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetInterview}
              disabled={isLoading}
            >
              New interview
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Chat area */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base">Interview chat</CardTitle>
          {!interviewStarted && (
            <CardDescription>
              Select a role and tap Start interview to begin
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0">
          <div
            className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6"
            aria-live="polite"
            aria-label="Interview conversation"
          >
            {!interviewStarted && (
              <p className="text-center text-sm text-muted-foreground">
                Your conversation will appear here.
              </p>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed sm:max-w-[75%]",
                    message.role === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-zinc-100 text-zinc-900"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Interviewer is typing…
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {error && (
            <div
              role="alert"
              className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              {error}
            </div>
          )}

          {/* Message input — fixed at bottom of the card */}
          <div className="border-t bg-background p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  interviewStarted
                    ? "Type your answer… (Enter to send)"
                    : "Start the interview to reply"
                }
                disabled={!interviewStarted || isLoading}
                rows={2}
                className="min-h-[44px] flex-1 resize-none"
              />
              <Button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={!canSend}
                className="shrink-0 sm:px-6"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="ml-2 sm:hidden">Send</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
