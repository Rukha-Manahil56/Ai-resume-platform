"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type FeedbackState = { type: "success" | "error"; message: string } | null;
type PageState = "loading" | "ready" | "no_session";

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const ok = feedback.type === "success";
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl"
      style={{
        background: ok ? "#ECFDF5" : "#FEF2F2",
        border: `1px solid ${ok ? "#A7F3D0" : "#FECACA"}`,
      }}
    >
      {ok ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#10B981" }} />
      ) : (
        <XCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
      )}
      <p
        style={{
          fontSize: "0.82rem",
          color: ok ? "#065F46" : "#991B1B",
          fontWeight: 500,
        }}
      >
        {feedback.message}
      </p>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          style={{
            width: "100%",
            padding: "10px 40px 10px 14px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            fontSize: "0.9rem",
            color: "#111111",
            background: disabled ? "#F9FAFB" : "#FFFFFF",
            outline: "none",
            transition: "border-color 0.15s ease",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#111111";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLInputElement).style.borderColor = "#E5E7EB";
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          disabled={disabled}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            display: "flex",
            alignItems: "center",
            padding: 0,
          }}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Password strength meter
───────────────────────────────────────────── */
function strengthScore(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 6) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 3) as 0 | 1 | 2 | 3;
}

const STRENGTH_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong",
};
const STRENGTH_COLORS: Record<0 | 1 | 2 | 3, string> = {
  0: "#E5E7EB",
  1: "#EF4444",
  2: "#F59E0B",
  3: "#10B981",
};

function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = strengthScore(password);
  const color = STRENGTH_COLORS[score];
  const label = STRENGTH_LABELS[score];
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {([1, 2, 3] as const).map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: "3px",
              borderRadius: "999px",
              background: i <= score ? color : "#E5E7EB",
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>
      {label && (
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color }}>
          {label}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [visible, setVisible] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [done, setDone] = useState(false);

  /* ── Detect Supabase recovery session from URL hash ── */
  useEffect(() => {
    const supabase = createClient();

    // Supabase SSR fires onAuthStateChange with event = "PASSWORD_RECOVERY"
    // when the recovery link is clicked. We just need to confirm a session exists.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setPageState("ready");
      }
    });

    // Also check if there's already an active session (user navigated here
    // with the token already exchanged by Supabase's PKCE flow)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("ready");
      } else {
        // Give onAuthStateChange a moment to fire for the hash-based token
        const fallback = setTimeout(() => setPageState("no_session"), 2500);
        return () => clearTimeout(fallback);
      }
    });

    const fadeIn = setTimeout(() => setVisible(true), 80);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fadeIn);
    };
  }, []);

  /* ── Validation ── */
  function validate(): string | null {
    if (!newPassword) return "Please enter a new password.";
    if (newPassword.length < 8) return "Password must be at least 8 characters.";
    if (strengthScore(newPassword) < 1) return "Password is too weak.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);

    const validationError = validate();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);

    if (error) {
      setFeedback({
        type: "error",
        message: error.message || "Failed to update password. Please try again.",
      });
      return;
    }

    setDone(true);
    setFeedback({
      type: "success",
      message: "Password updated successfully! Redirecting you to settings…",
    });

    setTimeout(() => router.push("/settings"), 2200);
  }

  /* ─────────────────────────────────────────────
     Render states
  ───────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "20px",
    padding: "32px",
    width: "100%",
    maxWidth: "420px",
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.45s ease, transform 0.45s ease",
  };

  // ── Loading ──
  if (pageState === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F8F9FA" }}
      >
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: "#9CA3AF" }}
        />
      </div>
    );
  }

  // ── No valid recovery session ──
  if (pageState === "no_session") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#F8F9FA" }}
      >
        <div style={cardStyle}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "#FEF2F2" }}
          >
            <XCircle className="w-5 h-5" style={{ color: "#EF4444" }} />
          </div>
          <h1
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#111111",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Link expired or invalid
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#6B7280",
              lineHeight: 1.6,
              marginBottom: "20px",
            }}
          >
            This password reset link has expired or has already been used.
            Request a new one from your settings page.
          </p>
          <button
            onClick={() => router.push("/settings")}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "10px",
              background: "#111111",
              color: "#FFFFFF",
              fontSize: "0.88rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  // ── Ready ──
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#F8F9FA" }}
    >
      <div style={cardStyle}>
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "#111111" }}
        >
          <KeyRound className="w-5 h-5" style={{ color: "#FFFFFF" }} />
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: "1.3rem",
            fontWeight: 900,
            color: "#111111",
            letterSpacing: "-0.03em",
            marginBottom: "4px",
          }}
        >
          Set new password
        </h1>
        <p
          style={{
            fontSize: "0.85rem",
            color: "#6B7280",
            marginBottom: "24px",
          }}
        >
          Choose a strong password for your CareerLens account.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div>
            <PasswordInput
              id="new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={submitting || done}
              autoComplete="new-password"
            />
            <StrengthMeter password={newPassword} />
          </div>

          <PasswordInput
            id="confirm-password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={submitting || done}
            autoComplete="new-password"
          />

          {/* Requirements hint */}
          <p style={{ fontSize: "0.75rem", color: "#9CA3AF", lineHeight: 1.5 }}>
            Must be at least 8 characters. Use a mix of uppercase, lowercase,
            numbers, and symbols for the best security.
          </p>

          {feedback && <FeedbackBanner feedback={feedback} />}

          <button
            type="submit"
            disabled={submitting || done}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "10px",
              background: submitting || done ? "#6B7280" : "#111111",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              fontWeight: 700,
              border: "none",
              cursor: submitting || done ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background 0.15s ease",
              marginTop: "4px",
            }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {done
              ? "Password updated!"
              : submitting
              ? "Updating…"
              : "Update Password"}
          </button>
        </form>

        {/* Footer link */}
        {!done && (
          <p
            style={{
              fontSize: "0.78rem",
              color: "#9CA3AF",
              textAlign: "center",
              marginTop: "16px",
            }}
          >
            Remember your password?{" "}
            <button
              onClick={() => router.push("/login")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#111111",
                fontWeight: 600,
                fontSize: "0.78rem",
                padding: 0,
              }}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}