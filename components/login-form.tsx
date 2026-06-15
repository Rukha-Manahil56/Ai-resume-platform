"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Loader2, Mail, Lock, User, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step =
  | "landing"
  | "signup"
  | "login"
  | "forgot-email"
  | "forgot-otp"
  | "forgot-newpw"
  | "forgot-done";

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 6 characters",        test: (pw) => pw.length >= 6 },
  { label: "At least 1 uppercase letter",  test: (pw) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter",  test: (pw) => /[a-z]/.test(pw) },
  { label: "At least 1 special character", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

function validatePassword(pw: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(pw)) return rule.label + " is required.";
  }
  return null;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const urlError = searchParams.get("error");

  const [step, setStep]     = useState<Step>("landing");
  const [isLoading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(urlError);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [otp, setOtp]             = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [newPw, setNewPw]         = useState("");
  const [confirmNewPw, setConfirmNewPw] = useState("");

  const supabase = createClient();

  function reset(target: Step) {
    setError(null);
    setSuccess(null);
    setStep(target);
  }

  /** Resolve the post-auth destination, never sending back to login or root */
  function resolveDestination(): string {
    if (
      !redirectTo ||
      redirectTo === "/" ||
      redirectTo === "/login" ||
      redirectTo.startsWith("//")
    ) {
      return "/dashboard";
    }
    return redirectTo;
  }

  function goToDestination() {
    window.location.href = resolveDestination();
  }

  /* ── Google OAuth ── */
  async function handleGoogle() {
    setLoading(true);
    setError(null);

    const destination = resolveDestination();

    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Pass the intended destination through the OAuth callback
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`,
      },
    });
    if (e) { setError(e.message); setLoading(false); }
  }

  /* ── Sign Up ── */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPw) { setError("Passwords do not match."); return; }

    setLoading(true);

    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (signUpErr) {
      setError(signUpErr.message);
      setLoading(false);
      return;
    }

    /* Auto sign-in after signup */
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

    if (loginErr) {
      setSuccess("Account created! Please sign in.");
      setStep("login");
    } else {
      goToDestination();
    }

    setLoading(false);
  }

  /* ── Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });

    if (loginErr) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    goToDestination();
  }

  /* ── Forgot password — send OTP ── */
  async function handleForgotSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpErr) {
      setError(otpErr.message);
      setLoading(false);
      return;
    }

    setSuccess(`A 6-digit OTP has been sent to ${email}`);
    setStep("forgot-otp");
    setLoading(false);
  }

  /* ── Forgot password — verify OTP ── */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);

    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (verifyErr) {
      setError("Invalid or expired code. Please try again.");
      setLoading(false);
      return;
    }

    setStep("forgot-newpw");
    setLoading(false);
  }

  /* ── Forgot password — set new password ── */
  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwError = validatePassword(newPw);
    if (pwError) { setError(pwError); return; }
    if (newPw !== confirmNewPw) { setError("Passwords do not match."); return; }

    setLoading(true);

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });

    if (updateErr) {
      setError(updateErr.message);
      setLoading(false);
      return;
    }

    setStep("forgot-done");
    setLoading(false);
  }

  /* ── Resend OTP ── */
  async function handleResendOtp() {
    setLoading(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (e) setError(e.message);
    else setSuccess("New code sent!");
    setLoading(false);
  }

  /* ────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen w-full">

      {/* ── Left hero panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "#0a0a0a" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black font-black text-sm">AI</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">CareerLens</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-white"
              style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
              Land your dream job with AI precision
            </h1>
            <p style={{ color: "oklch(0.65 0 0)", fontSize: "1.05rem", lineHeight: 1.7 }}>
              Upload your CV, get an instant ATS score, identify skill gaps,
              and practice interviews with an AI coach.
            </p>
          </div>
          <div className="space-y-3">
            {[
              "Instant ATS match score",
              "Missing skills analysis",
              "AI mock interview practice",
              "Hiring readiness report",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
                <span style={{ color: "oklch(0.75 0 0)", fontSize: "0.95rem" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: "oklch(0.35 0 0)", fontSize: "0.8rem" }}>
          © 2026 CareerLens. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-6 sm:p-10 bg-white">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white font-black text-sm">AI</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-black">CareerLens</span>
        </div>

        <div className="w-full max-w-sm" style={{ animation: "fadeUp 0.4s ease-out both" }}>

          {/* ══ LANDING ══ */}
          {step === "landing" && (
            <div className="space-y-6">
              <div>
                <h2 style={headingStyle}>Welcome</h2>
                <p style={subStyle}>Sign in or create a new account</p>
              </div>

              <GoogleButton loading={isLoading} onClick={handleGoogle} />

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: "#e5e5e5" }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs uppercase tracking-wider"
                        style={{ color: "#aaa" }}>or</span>
                </div>
              </div>

              <div className="space-y-3">
                <BlackButton onClick={() => reset("login")}>Sign in with email</BlackButton>
                <OutlineButton onClick={() => reset("signup")}>Create an account</OutlineButton>
              </div>

              {error && <ErrorMsg message={error} />}
            </div>
          )}

          {/* ══ SIGN UP ══ */}
          {step === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <BackBtn onClick={() => reset("landing")} />
              <div>
                <h2 style={headingStyle}>Create account</h2>
                <p style={subStyle}>Fill in your details to get started</p>
              </div>

              <InputField label="Full name" icon={<User className="w-4 h-4" />}>
                <input type="text" required placeholder="John Smith"
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="styled-input" />
              </InputField>

              <InputField label="Email" icon={<Mail className="w-4 h-4" />}>
                <input type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="styled-input" />
              </InputField>

              <InputField label="Password" icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }>
                <input type={showPw ? "text" : "password"} required
                  placeholder="Create a password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="styled-input" style={{ paddingRight: "2.8rem" }} />
              </InputField>

              {/* Live password rules checklist */}
              {password.length > 0 && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#f7f7f7" }}>
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#16a34a" }} />
                          : <XCircle    className="w-3.5 h-3.5 shrink-0" style={{ color: "#dc2626" }} />}
                        <span style={{ fontSize: "0.78rem", color: ok ? "#16a34a" : "#dc2626" }}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <InputField label="Confirm password" icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} tabIndex={-1}>
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }>
                <input type={showConfirmPw ? "text" : "password"} required
                  placeholder="Repeat password"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  className="styled-input" style={{ paddingRight: "2.8rem" }} />
              </InputField>

              {confirmPw.length > 0 && (
                <div className="flex items-center gap-2">
                  {confirmPw === password
                    ? <><CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                        <span style={{ fontSize: "0.78rem", color: "#16a34a" }}>Passwords match</span></>
                    : <><XCircle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                        <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>Passwords do not match</span></>
                  }
                </div>
              )}

              {error   && <ErrorMsg   message={error} />}
              {success && <SuccessMsg message={success} />}

              <SubmitBtn loading={isLoading} label="Create account" />

              <p className="text-center" style={{ fontSize: "0.85rem", color: "oklch(0.5 0 0)" }}>
                Already have an account?{" "}
                <button type="button" onClick={() => reset("login")}
                  className="font-semibold underline" style={{ color: "#0a0a0a" }}>
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* ══ LOGIN ══ */}
          {step === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <BackBtn onClick={() => reset("landing")} />
              <div>
                <h2 style={headingStyle}>Sign in</h2>
                <p style={subStyle}>Welcome back — enter your details</p>
              </div>

              <InputField label="Email" icon={<Mail className="w-4 h-4" />}>
                <input type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="styled-input" />
              </InputField>

              <InputField label="Password" icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }>
                <input type={showPw ? "text" : "password"} required
                  placeholder="Your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="styled-input" style={{ paddingRight: "2.8rem" }} />
              </InputField>

              <div className="flex justify-end">
                <button type="button" onClick={() => reset("forgot-email")}
                  className="underline" style={{ fontSize: "0.85rem", color: "#8B5CF6", fontWeight: 600 }}>
                  Forgot password?
                </button>
              </div>

              {error   && <ErrorMsg   message={error} />}
              {success && <SuccessMsg message={success} />}

              <SubmitBtn loading={isLoading} label="Sign in" />

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" style={{ borderColor: "#e5e5e5" }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs uppercase tracking-wider"
                        style={{ color: "#aaa" }}>or</span>
                </div>
              </div>

              <GoogleButton loading={isLoading} onClick={handleGoogle} />

              <p className="text-center" style={{ fontSize: "0.85rem", color: "oklch(0.5 0 0)" }}>
                Don&apos;t have an account?{" "}
                <button type="button" onClick={() => reset("signup")}
                  className="font-semibold underline" style={{ color: "#0a0a0a" }}>
                  Sign up
                </button>
              </p>
            </form>
          )}

          {/* ══ FORGOT — enter email ══ */}
          {step === "forgot-email" && (
            <form onSubmit={handleForgotSendOtp} className="space-y-5">
              <BackBtn onClick={() => reset("login")} />
              <div>
                <h2 style={headingStyle}>Reset password</h2>
                <p style={subStyle}>Enter your email to receive a 6-digit code</p>
              </div>

              <InputField label="Email" icon={<Mail className="w-4 h-4" />}>
                <input type="email" required placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="styled-input" />
              </InputField>

              {error && <ErrorMsg message={error} />}

              <SubmitBtn loading={isLoading} label="Send reset code" />
            </form>
          )}

          {/* ══ FORGOT — enter OTP ══ */}
          {step === "forgot-otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <h2 style={headingStyle}>Enter the code</h2>
                <p style={subStyle}>
                  {success ?? `We sent a 6-digit code to ${email}`}
                </p>
              </div>

              <div className="space-y-2">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0a0a0a" }}>
                  6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center font-mono tracking-[0.5em] py-4 rounded-xl border-2 text-2xl font-bold outline-none transition-all"
                  style={{
                    borderColor: otp.length === 6 ? "#8B5CF6" : "#e0e0e0",
                    color: "#0a0a0a",
                    background: "white",
                  }}
                />
                <p style={{ fontSize: "0.78rem", color: "oklch(0.55 0 0)", textAlign: "center" }}>
                  Numbers only · exactly 6 digits
                </p>
              </div>

              {error && <ErrorMsg message={error} />}

              <SubmitBtn loading={isLoading} label="Verify code" />

              <div className="flex justify-between">
                <button type="button" onClick={() => reset("forgot-email")}
                  className="underline text-sm" style={{ color: "oklch(0.5 0 0)" }}>
                  Wrong email?
                </button>
                <button type="button" onClick={handleResendOtp} disabled={isLoading}
                  className="underline text-sm font-semibold disabled:opacity-40"
                  style={{ color: "#8B5CF6" }}>
                  Resend code
                </button>
              </div>
            </form>
          )}

          {/* ══ FORGOT — new password ══ */}
          {step === "forgot-newpw" && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <h2 style={headingStyle}>New password</h2>
                <p style={subStyle}>Choose a strong new password</p>
              </div>

              <InputField label="New password" icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} tabIndex={-1}>
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }>
                <input type={showNewPw ? "text" : "password"} required
                  placeholder="New password"
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                  className="styled-input" style={{ paddingRight: "2.8rem" }} />
              </InputField>

              {newPw.length > 0 && (
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: "#f7f7f7" }}>
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(newPw);
                    return (
                      <div key={rule.label} className="flex items-center gap-2">
                        {ok
                          ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#16a34a" }} />
                          : <XCircle    className="w-3.5 h-3.5 shrink-0" style={{ color: "#dc2626" }} />}
                        <span style={{ fontSize: "0.78rem", color: ok ? "#16a34a" : "#dc2626" }}>
                          {rule.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <InputField label="Confirm new password" icon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button type="button" onClick={() => setShowConfirmNewPw(!showConfirmNewPw)} tabIndex={-1}>
                    {showConfirmNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }>
                <input type={showConfirmNewPw ? "text" : "password"} required
                  placeholder="Repeat new password"
                  value={confirmNewPw} onChange={(e) => setConfirmNewPw(e.target.value)}
                  className="styled-input" style={{ paddingRight: "2.8rem" }} />
              </InputField>

              {confirmNewPw.length > 0 && (
                <div className="flex items-center gap-2">
                  {confirmNewPw === newPw
                    ? <><CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                        <span style={{ fontSize: "0.78rem", color: "#16a34a" }}>Passwords match</span></>
                    : <><XCircle className="w-3.5 h-3.5" style={{ color: "#dc2626" }} />
                        <span style={{ fontSize: "0.78rem", color: "#dc2626" }}>Passwords do not match</span></>
                  }
                </div>
              )}

              {error && <ErrorMsg message={error} />}

              <SubmitBtn loading={isLoading} label="Update password" />
            </form>
          )}

          {/* ══ FORGOT — done ══ */}
          {step === "forgot-done" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                     style={{ background: "#f0fdf4" }}>
                  <CheckCircle2 className="w-8 h-8" style={{ color: "#16a34a" }} />
                </div>
              </div>
              <div>
                <h2 style={headingStyle}>Password updated</h2>
                <p style={subStyle}>Your password has been changed successfully.</p>
              </div>
              <BlackButton onClick={goToDestination}>Go to dashboard</BlackButton>
            </div>
          )}

        </div>

        <style>{`
          .styled-input {
            width: 100%;
            padding: 0.7rem 0.9rem 0.7rem 2.5rem;
            border: 2px solid #e0e0e0;
            border-radius: 0.75rem;
            font-size: 0.95rem;
            color: #0a0a0a;
            background: white;
            outline: none;
            transition: border-color 0.15s;
          }
          .styled-input:focus { border-color: #8B5CF6; }
          .styled-input::placeholder { color: #bbb; }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ── Style constants ── */
const headingStyle: React.CSSProperties = {
  fontSize: "1.8rem", fontWeight: 700, color: "#0a0a0a",
  letterSpacing: "-0.02em", lineHeight: 1.15,
};
const subStyle: React.CSSProperties = {
  fontSize: "0.9rem", color: "oklch(0.5 0 0)", marginTop: "0.25rem",
};

/* ── Reusable components ── */
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1 text-sm transition-opacity hover:opacity-60 mb-1"
      style={{ color: "oklch(0.5 0 0)" }}>
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}

function InputField({ label, icon, rightIcon, children }: {
  label: string; icon: React.ReactNode;
  rightIcon?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#0a0a0a" }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "oklch(0.6 0 0)" }}>{icon}</span>
        {children}
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "oklch(0.5 0 0)" }}>{rightIcon}</span>
        )}
      </div>
    </div>
  );
}

function SubmitBtn({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
      style={{ background: "#0a0a0a", color: "white" }}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {loading ? "Please wait…" : label}
    </button>
  );
}

function BlackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
      style={{ background: "#0a0a0a", color: "white" }}>
      {children}
    </button>
  );
}

function OutlineButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full py-3 px-4 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-gray-50 active:scale-[0.98]"
      style={{ borderColor: "#0a0a0a", color: "#0a0a0a" }}>
      {children}
    </button>
  );
}

function GoogleButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all hover:bg-gray-50 active:scale-[0.98] disabled:opacity-50"
      style={{ borderColor: "#e0e0e0", color: "#0a0a0a" }}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"/>
        <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17Z"/>
        <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07Z"/>
        <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31Z"/>
      </svg>
      {loading ? "Redirecting…" : "Continue with Google"}
    </button>
  );
}

function ErrorMsg({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm" role="alert"
         style={{ background: "#fff0f0", color: "#c0392b", border: "1px solid #fdd" }}>
      {message}
    </div>
  );
}

function SuccessMsg({ message }: { message: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-sm" role="status"
         style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}>
      {message}
    </div>
  );
}