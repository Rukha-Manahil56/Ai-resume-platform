/// <reference types="@types/dom-speech-recognition" />
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2, Send, RotateCcw, Play, Mic, MicOff,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { GEMINI_BUSY_MESSAGE, type AnalyzeCvErrorResponse } from "@/lib/gemini-errors";
import type { InterviewMessage } from "@/lib/interview-types";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import type { InterviewStage } from "@/app/api/interview/route";

/* ── Stage config ── */
const STAGES: { key: InterviewStage; label: string; description: string }[] = [
  { key: "introduction", label: "Introduction",  description: "Background & motivation"   },
  { key: "technical",    label: "Technical",     description: "Skills & problem solving"  },
  { key: "behavioral",   label: "Behavioral",    description: "Past experiences (STAR)"   },
  { key: "situational",  label: "Situational",   description: "Hypothetical scenarios"    },
  { key: "closing",      label: "Closing",       description: "Your questions & wrap-up"  },
];

function getStageIndex(stage: InterviewStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

/* ── API call ── */
function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type InterviewOutcome =
  | { success: true; reply: string; stage: InterviewStage }
  | { success: false; error: string };

async function fetchInterviewerReply(
  jobRole: string,
  messages: InterviewMessage[],
  stage: InterviewStage
): Promise<InterviewOutcome> {
  try {
    const response = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole, messages, stage }),
    });

    let data: { reply?: string; stage?: InterviewStage } &
      AnalyzeCvErrorResponse | null = null;

    try { data = await response.json(); } catch {
      return { success: false, error: "Unexpected server response." };
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

    if (!data?.reply?.trim())
      return { success: false, error: "Empty reply from interviewer." };

    return {
      success: true,
      reply: data.reply,
      stage: data.stage ?? stage,
    };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE };
  }
}

/* ── Voice input hook ── */
function useVoiceInput(
  onTranscript: (text: string) => void,
  disabled: boolean
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  const startRecording = useCallback(() => {
    if (disabled) return;
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [disabled, onTranscript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  return { isRecording, isSupported, startRecording, stopRecording };
}

/* ── Main component ── */
export default function MockInterviewPage() {
  const [jobRole, setJobRole]         = useState<JobTitle>(JOB_TITLES[0]);
  const [messages, setMessages]       = useState<InterviewMessage[]>([]);
  const [input, setInput]             = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [started, setStarted]         = useState(false);
  const [currentStage, setCurrentStage] = useState<InterviewStage>("introduction");
  const [isComplete, setIsComplete]   = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* Voice input */
  const handleVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  const { isRecording, isSupported, startRecording, stopRecording } =
    useVoiceInput(handleVoiceTranscript, !started || isLoading);

  /* Start interview */
  function handleStart() {
    setStarted(true);
    setError(null);
    setCurrentStage("introduction");
    setIsComplete(false);
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: `Hello! I'm your interviewer today. We're here for the ${jobRole} position.\n\nThis interview has 5 stages: Introduction, Technical, Behavioral, Situational, and Closing. I'll give you feedback after each answer.\n\nLet's begin.\n\nTell me about yourself and what drew you to the ${jobRole} role.`,
      },
    ]);
    setInput("");
  }

  /* Reset */
  function handleReset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setCurrentStage("introduction");
    setIsComplete(false);
  }

  /* Send message */
  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !started) return;

    const userMsg: InterviewMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setError(null);
    setIsLoading(true);

    const outcome = await fetchInterviewerReply(jobRole, history, currentStage);

    if (!outcome.success) {
      setMessages(messages);
      setInput(trimmed);
      setError(outcome.error);
      setIsLoading(false);
      return;
    }

    setMessages([
      ...history,
      { id: createMessageId(), role: "assistant", content: outcome.reply },
    ]);

    setCurrentStage(outcome.stage);
    if (outcome.stage === "complete") setIsComplete(true);
    setIsLoading(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const canSend = started && Boolean(input.trim()) && !isLoading && !isComplete;
  const stageIndex = getStageIndex(currentStage);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "#0f0f0f" }}>

      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(124,58,237,0.03) 1px,transparent 1px),
          linear-gradient(90deg,rgba(124,58,237,0.03) 1px,transparent 1px)
        `,
        backgroundSize: "48px 48px",
      }} />

      {/* Purple glow */}
      <div className="fixed bottom-0 left-0 pointer-events-none" style={{
        width: "600px", height: "400px",
        background: "radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)",
      }} />

      <div className="relative flex flex-col flex-1 max-w-3xl mx-auto w-full px-6 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-6">
          <h1 style={{
            fontSize: "clamp(1.8rem,4vw,2.4rem)",
            fontWeight: 800, color: "white", letterSpacing: "-0.03em",
          }}>
            Mock Interview
          </h1>
          <p style={{ color: "#666", marginTop: "0.4rem", fontSize: "1rem" }}>
            AI-powered interview practice based on real 2026 hiring trends
          </p>
        </div>

        {/* Role selector */}
        <div className="rounded-2xl p-5 mb-4"
             style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
          <label style={{
            fontSize: "0.85rem", fontWeight: 600,
            color: "#aaa", display: "block", marginBottom: "0.5rem",
          }}>
            Interview role
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value as JobTitle)}
              disabled={isLoading || started}
              className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50"
              style={{ background: "#0f0f0f", border: "1px solid #2a2a2a", color: "white" }}
            >
              {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            {!started ? (
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "#7C3AED", color: "white", whiteSpace: "nowrap" }}
              >
                <Play className="w-4 h-4" /> Start Interview
              </button>
            ) : (
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#aaa", whiteSpace: "nowrap" }}
              >
                <RotateCcw className="w-4 h-4" /> New Interview
              </button>
            )}
          </div>
        </div>

        {/* Stage progress bar — only show when started */}
        {started && (
          <div className="rounded-2xl p-4 mb-4"
               style={{ background: "#141414", border: "1px solid #1e1e1e" }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#aaa" }}>
                Interview Progress
              </span>
              <span style={{ fontSize: "0.8rem", color: "#7C3AED", fontWeight: 600 }}>
                {isComplete ? "Complete!" : STAGES[stageIndex]?.label ?? ""}
              </span>
            </div>

            {/* Stage steps */}
            <div className="flex items-center gap-1">
              {STAGES.map((stage, i) => {
                const done    = i < stageIndex;
                const active  = i === stageIndex && !isComplete;
                const pending = i > stageIndex && !isComplete;

                return (
                  <div key={stage.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className="w-full h-1.5 rounded-full mb-1.5"
                        style={{
                          background: done || isComplete
                            ? "#7C3AED"
                            : active
                            ? "#7C3AED80"
                            : "#2a2a2a",
                        }}
                      />
                      <span style={{
                        fontSize: "0.65rem",
                        color: done || active || isComplete ? "#7C3AED" : "#444",
                        fontWeight: active ? 700 : 400,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}>
                        {done || isComplete
                          ? <CheckCircle2
                              className="w-3 h-3 inline"
                              style={{ color: "#7C3AED" }}
                            />
                          : stage.label}
                      </span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <ChevronRight
                        className="w-3 h-3 shrink-0 mx-0.5"
                        style={{ color: "#2a2a2a" }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current stage description */}
            {!isComplete && (
              <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.5rem" }}>
                {STAGES[stageIndex]?.description}
              </p>
            )}
          </div>
        )}

        {/* Chat box */}
        <div
          className="flex flex-col flex-1 rounded-2xl overflow-hidden"
          style={{ background: "#141414", border: "1px solid #1e1e1e", minHeight: "460px" }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" aria-live="polite">

            {/* Empty state */}
            {!started && (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "#7C3AED20", border: "1px solid #7C3AED30" }}
                >
                  <Play className="w-6 h-6" style={{ color: "#7C3AED" }} />
                </div>
                <div>
                  <p style={{ color: "white", fontWeight: 600, marginBottom: "0.3rem" }}>
                    Ready to practice?
                  </p>
                  <p style={{ color: "#555", fontSize: "0.85rem" }}>
                    Select a role and click Start Interview
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-xs">
                  {STAGES.map((s) => (
                    <div key={s.key}
                      className="flex items-center gap-3 rounded-xl px-3 py-2"
                      style={{ background: "#0f0f0f", border: "1px solid #2a2a2a" }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "#7C3AED20" }}
                      >
                        <span style={{ fontSize: "0.65rem", color: "#7C3AED", fontWeight: 700 }}>
                          {STAGES.indexOf(s) + 1}
                        </span>
                      </div>
                      <div className="text-left">
                        <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "white" }}>
                          {s.label}
                        </p>
                        <p style={{ fontSize: "0.7rem", color: "#555" }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={
                    msg.role === "user"
                      ? { background: "#7C3AED", color: "white", borderBottomRightRadius: "4px" }
                      : { background: "#1e1e1e", color: "#ddd", borderBottomLeftRadius: "4px", border: "1px solid #2a2a2a" }
                  }
                >
                  {/* Highlight feedback sections in AI messages */}
                  {msg.role === "assistant"
                    ? msg.content.split("\n").map((line, i) => {
                        const isFeedback = line.startsWith("Feedback:");
                        const isNextQ    = line.startsWith("Next question:");
                        return (
                          <p key={i} style={{
                            marginBottom: "0.3rem",
                            color: isFeedback
                              ? "#a78bfa"
                              : isNextQ
                              ? "#e2e8f0"
                              : "#ddd",
                            fontWeight: isFeedback || isNextQ ? 600 : 400,
                          }}>
                            {line}
                          </p>
                        );
                      })
                    : msg.content
                  }
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: "#1e1e1e",
                    border: "1px solid #2a2a2a",
                    color: "#666",
                    borderBottomLeftRadius: "4px",
                  }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#7C3AED" }} />
                  Interviewer is thinking…
                </div>
              </div>
            )}

            {/* Interview complete banner */}
            {isComplete && (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: "#7C3AED15", border: "1px solid #7C3AED40" }}
              >
                <CheckCircle2
                  className="w-8 h-8 mx-auto mb-2"
                  style={{ color: "#7C3AED" }}
                />
                <p style={{ color: "white", fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>
                  Interview Complete!
                </p>
                <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Great job completing all 5 stages. Click New Interview to practice again.
                </p>
                <button
                  onClick={handleReset}
                  className="px-5 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: "#7C3AED", color: "white" }}
                >
                  Start New Interview
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div
              className="mx-4 mb-2 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "#1a1500",
                border: "1px solid #3a2e00",
                color: "#fbbf24",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Input area */}
          {!isComplete && (
            <div className="p-4" style={{ borderTop: "1px solid #1e1e1e" }}>

              {/* Voice recording indicator */}
              {isRecording && (
                <div
                  className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg"
                  style={{ background: "#7C3AED20", border: "1px solid #7C3AED40" }}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#ef4444" }}
                  />
                  <span style={{ fontSize: "0.8rem", color: "#a78bfa" }}>
                    Recording… speak now, click mic to stop
                  </span>
                </div>
              )}

              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    started
                      ? isRecording
                        ? "Listening…"
                        : "Type your answer or use the mic… (Enter to send)"
                      : "Start the interview to reply"
                  }
                  disabled={!started || isLoading}
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

                {/* Voice button — only show if browser supports it */}
                {isSupported && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!started || isLoading}
                    title={isRecording ? "Stop recording" : "Record voice answer"}
                    className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                    style={{
                      background: isRecording ? "#ef444420" : "#1e1e1e",
                      border: `1px solid ${isRecording ? "#ef4444" : "#2a2a2a"}`,
                      color: isRecording ? "#ef4444" : "#666",
                    }}
                  >
                    {isRecording
                      ? <MicOff className="w-4 h-4" />
                      : <Mic className="w-4 h-4" />}
                  </button>
                )}

                {/* Send button */}
                <button
                  onClick={() => void handleSend()}
                  disabled={!canSend}
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 active:scale-95"
                  style={{ background: "#7C3AED", color: "white" }}
                  aria-label="Send message"
                >
                  {isLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>

              {/* Voice not supported notice */}
              {!isSupported && started && (
                <p style={{ fontSize: "0.72rem", color: "#444", marginTop: "0.4rem" }}>
                  Voice input not supported in this browser. Use Chrome or Edge for voice.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}