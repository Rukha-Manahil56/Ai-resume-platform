"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, RotateCcw, Play } from "lucide-react";
import { GEMINI_BUSY_MESSAGE, type AnalyzeCvErrorResponse } from "@/lib/gemini-errors";
import type { InterviewMessage } from "@/lib/interview-types";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";

const OPENING_QUESTION = "Tell me about yourself.";

type InterviewOutcome =
  | { success: true; reply: string }
  | { success: false; error: string };

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fetchInterviewerReply(jobRole: string, messages: InterviewMessage[]): Promise<InterviewOutcome> {
  try {
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole, messages }),
    });
    let data: { reply?: string } & AnalyzeCvErrorResponse | null = null;
    try { data = await response.json(); } catch {
      return { success: false, error: "Unexpected server response. Please try again." };
    }
    if (!response.ok) {
      return { success: false, error: data?.error ?? (response.status === 503 || response.status === 429 ? GEMINI_BUSY_MESSAGE : "Could not get a response. Please try again.") };
    }
    if (!data?.reply?.trim()) return { success: false, error: "Empty reply from interviewer." };
    return { success: true, reply: data.reply };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE };
  }
}

export default function MockInterviewPage() {
  const [jobRole, setJobRole]               = useState<JobTitle>(JOB_TITLES[0]);
  const [messages, setMessages]             = useState<InterviewMessage[]>([]);
  const [input, setInput]                   = useState("");
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleStartInterview() {
    setInterviewStarted(true);
    setError(null);
    setMessages([{ id: createMessageId(), role: "assistant", content: OPENING_QUESTION }]);
    setInput("");
  }

  function handleResetInterview() {
    setInterviewStarted(false);
    setMessages([]); setInput(""); setError(null); setIsLoading(false);
  }

  async function handleSendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !interviewStarted) return;

    const userMessage: InterviewMessage = { id: createMessageId(), role: "user", content: trimmed };
    const historyWithUser = [...messages, userMessage];
    setMessages(historyWithUser); setInput(""); setError(null); setIsLoading(true);

    const outcome = await fetchInterviewerReply(jobRole, historyWithUser);

    if (!outcome.success) {
      setMessages(messages); setInput(trimmed); setError(outcome.error); setIsLoading(false); return;
    }

    setMessages([...historyWithUser, { id: createMessageId(), role: "assistant", content: outcome.reply }]);
    setIsLoading(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); }
  }

  const canSend = interviewStarted && Boolean(input.trim()) && !isLoading;

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      {/* Purple glow */}
      <div className="fixed bottom-0 left-64 pointer-events-none" style={{
        width: "600px", height: "400px",
        background: "radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)",
      }} />

      <div className="relative flex flex-col flex-1 max-w-3xl mx-auto w-full px-6 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>
            Mock Interview
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            Practice with an AI interviewer powered by Gemini
          </p>
        </div>

        {/* Role selector + start/reset */}
        <div className="rounded-2xl p-5 mb-5"
             style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#aaa", display: "block", marginBottom: "0.5rem" }}>
            Interview role
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value as JobTitle)}
              disabled={isLoading || interviewStarted}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "white" }}
            >
              {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {!interviewStarted ? (
              <button onClick={handleStartInterview}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#7C3AED", color: "white", whiteSpace: "nowrap" }}>
                <Play className="w-4 h-4" /> Start Interview
              </button>
            ) : (
              <button onClick={handleResetInterview} disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", whiteSpace: "nowrap" }}>
                <RotateCcw className="w-4 h-4" /> New Interview
              </button>
            )}
          </div>
        </div>

        {/* Chat box */}
        <div className="flex flex-col flex-1 rounded-2xl overflow-hidden"
             style={{ background: "#141414", border: "1px solid #1e1e1e", minHeight: "500px" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" aria-live="polite">
            {!interviewStarted && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                     style={{ background: "#7C3AED20", border: "1px solid #7C3AED30" }}>
                  <Play className="w-6 h-6" style={{ color: "#7C3AED" }} />
                </div>
                <p style={{ color: "#555", fontSize: "0.9rem" }}>
                  Select a role and click Start Interview to begin
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={msg.role === "user"
                    ? { background: "#7C3AED", color: "white", borderBottomRightRadius: "4px" }
                    : { background: "#1e1e1e", color: "#ddd", borderBottomLeftRadius: "4px", border: "1px solid #2a2a2a" }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                     style={{ background: "#1e1e1e", border: "1px solid #2a2a2a", color: "#666", borderBottomLeftRadius: "4px" }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#7C3AED" }} />
                  Interviewer is typing…
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="mx-4 mb-2 rounded-xl px-4 py-3 text-sm"
                 style={{ background: "#1a1500", border: "1px solid #3a2e00", color: "#fbbf24" }}
                 role="alert">
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="p-4" style={{ borderTop: "1px solid #1e1e1e" }}>
            <div className="flex gap-3 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={interviewStarted ? "Type your answer… (Enter to send, Shift+Enter for new line)" : "Start the interview to reply"}
                disabled={!interviewStarted || isLoading}
                rows={2}
                className="flex-1 rounded-xl px-4 py-3 text-sm leading-relaxed resize-none outline-none disabled:opacity-40"
                style={{
                  background: "#0f0f0f",
                  border: "1px solid #2a2a2a",
                  color: "white",
                  fontFamily: "inherit",
                  minHeight: "52px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                onBlur={(e) => (e.target.style.borderColor = "#2a2a2a")}
              />
              <button
                onClick={() => void handleSendMessage()}
                disabled={!canSend}
                className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                style={{ background: "#7C3AED", color: "white" }}
                aria-label="Send message"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}