/// <reference types="@types/dom-speech-recognition" />
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send, RotateCcw, Play, Mic, MicOff,
  CheckCircle2, ChevronRight, Loader2,
} from "lucide-react";
import { GEMINI_BUSY_MESSAGE, type AnalyzeCvErrorResponse } from "@/lib/gemini-errors";
import type { InterviewMessage } from "@/lib/interview-types";
import { JOB_TITLES, type JobTitle } from "@/lib/job-titles";
import type { InterviewStage } from "@/app/api/interview/route";

/* ── Stage config — unchanged ── */
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

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type InterviewOutcome =
  | { success: true; reply: string; stage: InterviewStage }
  | { success: false; error: string };

/* ── API call — unchanged ── */
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

    return { success: true, reply: data.reply, stage: data.stage ?? stage };
  } catch {
    return { success: false, error: GEMINI_BUSY_MESSAGE };
  }
}

/* ── Voice input hook — unchanged ── */
function useVoiceInput(onTranscript: (text: string) => void, disabled: boolean) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setIsSupported(Boolean(SR));
  }, []);

  const startRecording = useCallback(() => {
    if (disabled) return;
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
    };
    recognition.onend  = () => setIsRecording(false);
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

/* ── Parse AI message into sections ── */
function parseAiMessage(content: string) {
  const lines = content.split("\n");
  const feedbackLines: string[] = [];
  const questionLines: string[] = [];
  const otherLines:   string[] = [];

  let inFeedback = false;
  let inQuestion = false;

  for (const line of lines) {
    if (line.startsWith("Feedback:")) { inFeedback = true;  inQuestion = false; feedbackLines.push(line); continue; }
    if (line.startsWith("Next question:")) { inQuestion = true; inFeedback = false; questionLines.push(line); continue; }
    if (inFeedback) { feedbackLines.push(line); continue; }
    if (inQuestion) { questionLines.push(line); continue; }
    otherLines.push(line);
  }

  return {
    other:    otherLines.join("\n").trim(),
    feedback: feedbackLines.join("\n").trim(),
    question: questionLines.join("\n").trim(),
  };
}

/* ── Main component ── */
export default function MockInterviewPage() {
  const [jobRole, setJobRole]           = useState<JobTitle>(JOB_TITLES[0]);
  const [messages, setMessages]         = useState<InterviewMessage[]>([]);
  const [input, setInput]               = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [started, setStarted]           = useState(false);
  const [currentStage, setCurrentStage] = useState<InterviewStage>("introduction");
  const [isComplete, setIsComplete]     = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleVoiceTranscript = useCallback((text: string) => {
    setInput((prev) => prev ? `${prev} ${text}` : text);
  }, []);

  const { isRecording, isSupported, startRecording, stopRecording } =
    useVoiceInput(handleVoiceTranscript, !started || isLoading);

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

  function handleReset() {
    setStarted(false);
    setMessages([]);
    setInput("");
    setError(null);
    setIsLoading(false);
    setCurrentStage("introduction");
    setIsComplete(false);
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !started) return;

    const userMsg: InterviewMessage = { id: createMessageId(), role: "user", content: trimmed };
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

    setMessages([...history, { id: createMessageId(), role: "assistant", content: outcome.reply }]);
    setCurrentStage(outcome.stage);
    if (outcome.stage === "complete") setIsComplete(true);
    setIsLoading(false);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(); }
  }

  const canSend   = started && Boolean(input.trim()) && !isLoading && !isComplete;
  const stageIdx  = getStageIndex(currentStage);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9f9f9",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          width: "100%",
          padding: "40px 24px 40px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "8px" }}>
            Practice
          </div>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "6px" }}>
            Mock interview
          </h1>
          <p style={{ fontSize: "14px", color: "#888" }}>
            Role-specific AI interviewer with real-time feedback
          </p>
        </div>

        {/* Main two-column layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", flex: 1, alignItems: "start" }}
          className="interview-grid"
        >

          {/* ── LEFT PANEL ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

            {/* Role selector */}
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px", overflow: "hidden" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f0f0" }}>
                <p style={{ fontSize: "12.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                  Interview setup
                </p>
              </div>
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, color: "#aaa", display: "block", marginBottom: "6px" }}>
                    Job role
                  </label>
                  <select
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value as JobTitle)}
                    disabled={isLoading || started}
                    style={{
                      width: "100%",
                      background: "#fafafa",
                      border: "1px solid #e4e4e4",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      color: "#0a0a0a",
                      outline: "none",
                      fontFamily: "inherit",
                      cursor: started ? "not-allowed" : "pointer",
                      opacity: started ? 0.5 : 1,
                    }}
                  >
                    {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {!started ? (
                  <button
                    onClick={handleStart}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                      background: "#0a0a0a", color: "#fff",
                      border: "none", borderRadius: "9px",
                      padding: "10px", fontSize: "13.5px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                  >
                    <Play size={14} /> Start interview
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                      background: "#fff", color: "#555",
                      border: "1px solid #e4e4e4", borderRadius: "9px",
                      padding: "10px", fontSize: "13px", fontWeight: 550,
                      cursor: isLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
                      opacity: isLoading ? 0.5 : 1,
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.borderColor = "#aaa"; }}
                    onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLElement).style.borderColor = "#e4e4e4"; }}
                  >
                    <RotateCcw size={13} /> New interview
                  </button>
                )}
              </div>
            </div>

            {/* Stage progress — only when started */}
            {started && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "16px 18px", borderBottom: "1px solid #f0f0f0" }}>
                  <p style={{ fontSize: "12.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em" }}>
                    Interview stages
                  </p>
                </div>
                <div style={{ padding: "10px 8px" }}>
                  {STAGES.map((stage, i) => {
                    const done   = isComplete || i < stageIdx;
                    const active = !isComplete && i === stageIdx;
                    return (
                      <div
                        key={stage.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "9px 10px",
                          borderRadius: "8px",
                          background: active ? "#f5f5f5" : "transparent",
                          marginBottom: "2px",
                        }}
                      >
                        {/* Step indicator */}
                        <div
                          style={{
                            width: "22px", height: "22px", flexShrink: 0,
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: done ? "#0a0a0a" : active ? "#0a0a0a" : "#f0f0f0",
                            border: done || active ? "none" : "1px solid #e0e0e0",
                          }}
                        >
                          {done ? (
                            <CheckCircle2 size={12} style={{ color: "#fff" }} />
                          ) : (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: active ? "#fff" : "#bbb" }}>
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: "12.5px", fontWeight: active ? 650 : 450, color: active || done ? "#0a0a0a" : "#aaa", lineHeight: 1.2 }}>
                            {stage.label}
                          </p>
                          <p style={{ fontSize: "11px", color: "#bbb", lineHeight: 1.3, marginTop: "1px" }}>
                            {stage.description}
                          </p>
                        </div>
                        {active && <ChevronRight size={13} style={{ color: "#ccc", marginLeft: "auto", flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tips — only before start */}
            {!started && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "14px", padding: "16px 18px" }}>
                <p style={{ fontSize: "12.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.01em", marginBottom: "12px" }}>
                  Interview stages
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {STAGES.map((s, i) => (
                    <div key={s.key} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <div
                        style={{
                          width: "20px", height: "20px", flexShrink: 0,
                          background: "#f0f0f0",
                          borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: "9px", fontWeight: 700, color: "#aaa" }}>{i + 1}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: "12px", fontWeight: 550, color: "#555", lineHeight: 1.3 }}>
                          {s.label}
                        </p>
                        <p style={{ fontSize: "11px", color: "#bbb", lineHeight: 1.4 }}>
                          {s.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── CHAT AREA ── */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e8e8e8",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              minHeight: "600px",
              overflow: "hidden",
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fafafa",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "28px", height: "28px",
                    background: started ? "#0a0a0a" : "#f0f0f0",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: started ? "#fff" : "#aaa" }}>AI</span>
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0a0a0a", lineHeight: 1.2 }}>
                    AI Interviewer
                  </p>
                  <p style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.2 }}>
                    {started
                      ? isComplete
                        ? "Interview complete"
                        : isLoading
                        ? "Typing..."
                        : `${STAGES[stageIdx]?.label ?? ""} stage`
                      : "Ready to begin"}
                  </p>
                </div>
              </div>
              {started && !isComplete && (
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    fontSize: "11px", color: "#2d7a4f",
                    background: "#f0faf4", border: "1px solid #c8ecd8",
                    padding: "3px 10px", borderRadius: "20px",
                  }}
                >
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2d7a4f" }} />
                  In progress
                </div>
              )}
            </div>

            {/* Messages */}
            <div
              style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
              aria-live="polite"
            >

              {/* Empty / not started */}
              {!started && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px 20px" }}>
                  <div
                    style={{
                      width: "44px", height: "44px",
                      background: "#f5f5f5", border: "1px solid #eee",
                      borderRadius: "12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <Play size={18} style={{ color: "#888" }} />
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "#0a0a0a", marginBottom: "6px" }}>
                    Ready when you are
                  </p>
                  <p style={{ fontSize: "13px", color: "#aaa", lineHeight: 1.6 }}>
                    Select a job role and click{" "}
                    <span style={{ fontWeight: 550, color: "#555" }}>Start interview</span>{" "}
                    to begin your practice session.
                  </p>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div
                        style={{
                          maxWidth: "75%",
                          background: "#0a0a0a",
                          color: "#fff",
                          borderRadius: "14px",
                          borderBottomRightRadius: "4px",
                          padding: "12px 16px",
                          fontSize: "13.5px",
                          lineHeight: 1.65,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                /* AI message — parsed into sections */
                const parsed = parseAiMessage(msg.content);
                return (
                  <div key={msg.id} style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "8px" }}>

                      {/* General / intro text */}
                      {parsed.other && (
                        <div
                          style={{
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                            borderRadius: "14px",
                            borderBottomLeftRadius: "4px",
                            padding: "12px 16px",
                            fontSize: "13.5px",
                            color: "#333",
                            lineHeight: 1.65,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {parsed.other}
                        </div>
                      )}

                      {/* Feedback block */}
                      {parsed.feedback && (
                        <div
                          style={{
                            background: "#fafafa",
                            border: "1px solid #e8e8e8",
                            borderRadius: "10px",
                            padding: "12px 14px",
                          }}
                        >
                          <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                            Feedback
                          </p>
                          <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                            {parsed.feedback.replace(/^Feedback:\s*/i, "")}
                          </p>
                        </div>
                      )}

                      {/* Next question block */}
                      {parsed.question && (
                        <div
                          style={{
                            background: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            borderLeft: "3px solid #0a0a0a",
                          }}
                        >
                          <p style={{ fontSize: "10.5px", fontWeight: 700, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                            Next question
                          </p>
                          <p style={{ fontSize: "13.5px", fontWeight: 550, color: "#0a0a0a", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                            {parsed.question.replace(/^Next question:\s*/i, "")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div
                    style={{
                      background: "#fafafa",
                      border: "1px solid #f0f0f0",
                      borderRadius: "14px",
                      borderBottomLeftRadius: "4px",
                      padding: "12px 16px",
                      display: "flex", alignItems: "center", gap: "8px",
                    }}
                  >
                    <Loader2 size={13} style={{ color: "#aaa", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: "13px", color: "#aaa" }}>Interviewer is responding…</span>
                  </div>
                </div>
              )}

              {/* Complete banner */}
              {isComplete && (
                <div
                  style={{
                    background: "#fafafa",
                    border: "1px solid #e8e8e8",
                    borderRadius: "12px",
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle2 size={28} style={{ color: "#2d7a4f", margin: "0 auto 10px" }} />
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#0a0a0a", marginBottom: "6px" }}>
                    Interview complete
                  </p>
                  <p style={{ fontSize: "13px", color: "#888", marginBottom: "18px", lineHeight: 1.6 }}>
                    You've completed all five stages. Click below to practice again with a fresh session.
                  </p>
                  <button
                    onClick={handleReset}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: "#0a0a0a", color: "#fff",
                      border: "none", borderRadius: "8px",
                      padding: "9px 18px", fontSize: "13px", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <RotateCcw size={13} /> Start new interview
                  </button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  margin: "0 16px 8px",
                  padding: "10px 14px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  color: "#92400e",
                }}
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Input area */}
            {!isComplete && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid #f0f0f0" }}>

                {/* Recording indicator */}
                {isRecording && (
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: "7px",
                      marginBottom: "8px",
                      padding: "6px 12px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "7px",
                    }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#dc2626", animation: "pulse 1s infinite" }} />
                    <span style={{ fontSize: "12px", color: "#991b1b", fontWeight: 500 }}>
                      Listening — speak now, click mic to stop
                    </span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      !started
                        ? "Start the interview to type here…"
                        : isRecording
                        ? "Listening…"
                        : "Type your answer… (Enter to send, Shift+Enter for new line)"
                    }
                    disabled={!started || isLoading}
                    rows={2}
                    style={{
                      flex: 1,
                      background: "#fafafa",
                      border: "1px solid #e4e4e4",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "13.5px",
                      color: "#0a0a0a",
                      lineHeight: 1.6,
                      outline: "none",
                      resize: "none",
                      fontFamily: "inherit",
                      transition: "border-color 0.15s",
                      minHeight: "46px",
                      opacity: !started || isLoading ? 0.5 : 1,
                    }}
                    onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "#0a0a0a")}
                    onBlur={(e)  => ((e.target as HTMLElement).style.borderColor = "#e4e4e4")}
                  />

                  {/* Mic button */}
                  {isSupported && (
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!started || isLoading}
                      title={isRecording ? "Stop recording" : "Record voice answer"}
                      style={{
                        width: "40px", height: "40px", flexShrink: 0,
                        background: isRecording ? "#fef2f2" : "#f5f5f5",
                        border: `1px solid ${isRecording ? "#fecaca" : "#e4e4e4"}`,
                        borderRadius: "9px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: !started || isLoading ? "not-allowed" : "pointer",
                        opacity: !started || isLoading ? 0.4 : 1,
                        transition: "all 0.15s",
                        color: isRecording ? "#dc2626" : "#888",
                      }}
                    >
                      {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    onClick={() => void handleSend()}
                    disabled={!canSend}
                    style={{
                      width: "40px", height: "40px", flexShrink: 0,
                      background: canSend ? "#0a0a0a" : "#f0f0f0",
                      border: "none",
                      borderRadius: "9px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: canSend ? "pointer" : "not-allowed",
                      transition: "opacity 0.15s",
                      color: canSend ? "#fff" : "#ccc",
                    }}
                    aria-label="Send message"
                  >
                    {isLoading
                      ? <Loader2 size={15} style={{ animation: "spin 0.8s linear infinite" }} />
                      : <Send size={15} />}
                  </button>
                </div>

                {!isSupported && started && (
                  <p style={{ fontSize: "11.5px", color: "#bbb", marginTop: "6px" }}>
                    Voice input requires Chrome or Edge.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .interview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}