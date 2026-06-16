"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Mail,
  Shield,
  LogOut,
  Trash2,
  KeyRound,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type FeedbackState = { type: "success" | "error"; message: string } | null;

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */
function Skeleton({ w = "100%", h = "16px", radius = "8px" }: { w?: string; h?: string; radius?: string }) {
  return (
    <div
      className="animate-pulse"
      style={{ width: w, height: h, borderRadius: radius, background: "#F3F4F6" }}
    />
  );
}

function SkeletonPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8F9FA" }}>
      <div className="max-w-2xl mx-auto px-6 py-12 sm:px-10 flex flex-col gap-6">
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: "#F3F4F6", flexShrink: 0 }} />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton w="45%" h="18px" />
              <Skeleton w="60%" h="14px" />
            </div>
          </div>
        </div>
        {[1, 2].map((i) => (
          <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
              <Skeleton w="30%" h="16px" />
            </div>
            <div className="flex flex-col gap-3">
              <Skeleton h="48px" radius="12px" />
              <Skeleton h="48px" radius="12px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section Card wrapper
───────────────────────────────────────────── */
function SectionCard({
  icon,
  title,
  description,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "16px",
        padding: "24px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "#F3F4F6" }}
        >
          {icon}
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#111111", letterSpacing: "-0.01em" }}>
            {title}
          </p>
          <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Info Row
───────────────────────────────────────────── */
function InfoRow({
  label,
  value,
  badge,
}: {
  label: string;
  value?: string;
  badge?: { text: string; color: string };
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{ background: "#F8F9FA", border: "1px solid #E5E7EB" }}
    >
      <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>{label}</span>
      {badge ? (
        <span
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "999px",
            background: badge.color + "12",
            color: badge.color,
            border: `1px solid ${badge.color}25`,
          }}
        >
          {badge.text}
        </span>
      ) : (
        <span style={{ fontSize: "0.85rem", color: "#111111", fontWeight: 500 }}>
          {value}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Action Button Row (used for Change Password / Sign out)
───────────────────────────────────────────── */
function ActionButton({
  icon,
  label,
  sub,
  onClick,
  loading,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 text-left"
      style={{
        background: "#F8F9FA",
        border: "1px solid #E5E7EB",
        color: "#111111",
        cursor: disabled || loading ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#F8F9FA";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
      }}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "#6B7280" }} />
      ) : (
        <span className="shrink-0" style={{ color: "#6B7280" }}>{icon}</span>
      )}
      <div className="flex-1">
        <p>{label}</p>
        {sub && <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1px", fontWeight: 400 }}>{sub}</p>}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Feedback banner
───────────────────────────────────────────── */
function FeedbackBanner({ feedback }: { feedback: FeedbackState }) {
  if (!feedback) return null;
  const isSuccess = feedback.type === "success";
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl"
      style={{
        background: isSuccess ? "#ECFDF5" : "#FEF2F2",
        border: `1px solid ${isSuccess ? "#A7F3D0" : "#FECACA"}`,
      }}
    >
      {isSuccess ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#10B981" }} />
      ) : (
        <XCircle className="w-4 h-4 shrink-0" style={{ color: "#EF4444" }} />
      )}
      <p style={{ fontSize: "0.82rem", color: isSuccess ? "#065F46" : "#991B1B", fontWeight: 500 }}>
        {feedback.message}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Confirm Modal (used for both destructive actions)
───────────────────────────────────────────── */
function ConfirmModal({
  title,
  description,
  confirmLabel,
  requireTyped,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  requireTyped?: string; // if set, user must type this exact text to confirm
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const canConfirm = requireTyped ? typed === requireTyped : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "420px",
          padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: "#FEF2F2" }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: "#EF4444" }} />
        </div>
        <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111111", marginBottom: "8px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#6B7280", lineHeight: 1.6, marginBottom: requireTyped ? "16px" : "20px" }}>
          {description}
        </p>

        {requireTyped && (
          <div className="mb-5">
            <p style={{ fontSize: "0.78rem", color: "#6B7280", marginBottom: "6px" }}>
              Type <span style={{ fontWeight: 700, color: "#111111" }}>{requireTyped}</span> to confirm
            </p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #E5E7EB",
                fontSize: "0.85rem",
                color: "#111111",
                outline: "none",
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              background: "#F8F9FA",
              color: "#6B7280",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "1.5px solid #EF4444",
              background: !canConfirm || loading ? "#FCA5A5" : "#EF4444",
              color: "#FFFFFF",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: !canConfirm || loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function SettingsPage() {
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
    app_metadata?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  // Change password
  const [resetSending, setResetSending] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<FeedbackState>(null);

  // Delete reports
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [deletingReports, setDeletingReports] = useState(false);
  const [reportsFeedback, setReportsFeedback] = useState<FeedbackState>(null);

  // Delete account
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u as typeof user);
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";
  const initials = getInitials(displayName);
  const provider =
    (user?.app_metadata?.provider as string | undefined) ?? "email";
  const isGoogle = provider === "google";
  const providerLabel = isGoogle
    ? "Google"
    : provider === "github"
    ? "GitHub"
    : "Email / Password";

  /* ── Change Password ── */
  async function handleChangePassword() {
    if (!user?.email) return;
    setResetSending(true);
    setResetFeedback(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetSending(false);
    if (error) {
      setResetFeedback({ type: "error", message: error.message || "Could not send reset email." });
    } else {
      setResetFeedback({ type: "success", message: `Password reset link sent to ${user.email}.` });
    }
  }

  /* ── Delete All Reports ── */
  async function handleDeleteReports() {
    if (!user?.id) return;
    setDeletingReports(true);
    setReportsFeedback(null);
    const supabase = createClient();
    const { error } = await supabase.from("analyses").delete().eq("user_id", user.id);
    setDeletingReports(false);
    setReportsModalOpen(false);
    if (error) {
      setReportsFeedback({ type: "error", message: error.message || "Failed to delete reports." });
    } else {
      setReportsFeedback({ type: "success", message: "All your reports have been deleted." });
    }
  }

  /* ── Delete Account ──
     No server route exists yet for secure deletion (service role required).
     We surface this honestly instead of faking client-side deletion. */
  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setAccountFeedback(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        throw new Error("not_implemented");
      }
      // If a real route exists and succeeds:
      window.location.href = "/";
    } catch {
      setDeletingAccount(false);
      setAccountModalOpen(false);
      setAccountFeedback({
        type: "error",
        message:
          "Account deletion requires a secure server-side route, which hasn't been set up yet. No data was deleted.",
      });
    }
  }

  if (loading) return <SkeletonPage />;

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FA" }}>
      {reportsModalOpen && (
        <ConfirmModal
          title="Delete all reports?"
          description="This will permanently delete every resume analysis and report tied to your account. This cannot be undone."
          confirmLabel="Delete All Reports"
          loading={deletingReports}
          onConfirm={handleDeleteReports}
          onCancel={() => setReportsModalOpen(false)}
        />
      )}

      {accountModalOpen && (
        <ConfirmModal
          title="Delete your account?"
          description="This permanently deletes your account and all associated data. This action cannot be undone."
          confirmLabel="Delete Account"
          requireTyped="DELETE"
          loading={deletingAccount}
          onConfirm={handleDeleteAccount}
          onCancel={() => setAccountModalOpen(false)}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-12 sm:px-10 flex flex-col gap-5">

        {/* ── Header ── */}
        <div
          style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            marginBottom: "8px",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#111111" }}
            >
              <Settings className="w-4 h-4" style={{ color: "#FFFFFF" }} />
            </div>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Settings
            </span>
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              fontWeight: 900,
              color: "#111111",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "6px",
            }}
          >
            Account & Preferences
          </h1>
          <p style={{ color: "#6B7280", fontSize: "0.95rem" }}>
            Manage your account, security, and data.
          </p>
        </div>

        {/* ── Account ── */}
        <SectionCard
          icon={<Mail className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Account"
          description="Your basic account information."
          delay={120}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="flex items-center justify-center shrink-0 rounded-2xl text-lg font-black"
              style={{ width: "56px", height: "56px", background: "#111111", color: "#FFFFFF", letterSpacing: "-0.04em" }}
            >
              {initials}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#111111" }}>{displayName}</p>
              <p style={{ fontSize: "0.82rem", color: "#6B7280", marginTop: "2px" }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <InfoRow label="Email address" value={user?.email ?? "—"} />
          </div>
        </SectionCard>

        {/* ── Security ── */}
        <SectionCard
          icon={<Shield className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Security"
          description="Manage your password, login provider, and sessions."
          delay={200}
        >
          <div className="flex flex-col gap-2">
            {isGoogle ? (
              <InfoRow
                label="Password"
                value="Managed through Google"
              />
            ) : (
              <>
                <ActionButton
                  icon={<KeyRound className="w-4 h-4" />}
                  label="Change Password"
                  sub="We'll email you a secure link to reset it."
                  onClick={handleChangePassword}
                  loading={resetSending}
                  disabled={!user?.email}
                />
                {resetFeedback && <FeedbackBanner feedback={resetFeedback} />}
              </>
            )}

            <InfoRow
              label="Connected account"
              badge={
                isGoogle
                  ? { text: "Connected with Google", color: "#10B981" }
                  : { text: providerLabel, color: "#6B7280" }
              }
            />

            <ActionButton
              icon={<LogOut className="w-4 h-4" />}
              label={signingOut ? "Signing out…" : "Sign out everywhere"}
              sub="Ends your session on all devices."
              onClick={handleSignOut}
              loading={signingOut}
            />
          </div>
        </SectionCard>

        {/* ── Data ── */}
        <SectionCard
          icon={<Database className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Data"
          description="Manage your reports and account data."
          delay={280}
        >
          <div className="flex flex-col gap-2">
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              label="Delete All Reports"
              sub="Permanently removes all your resume analyses."
              onClick={() => setReportsModalOpen(true)}
            />
            {reportsFeedback && <FeedbackBanner feedback={reportsFeedback} />}
          </div>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div
          style={{
            border: "1px solid #FCA5A5",
            borderRadius: "16px",
            padding: "24px",
            background: "#FFFFFF",
          }}
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "#FEF2F2" }}
            >
              <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.92rem", color: "#EF4444", letterSpacing: "-0.01em" }}>
                Danger Zone
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                Destructive actions that cannot be reversed.
              </p>
            </div>
          </div>

          <div
            className="flex items-center justify-between gap-4 flex-wrap px-4 py-4 rounded-xl mb-3"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111111" }}>Delete Account</p>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setAccountModalOpen(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1.5px solid #EF4444",
                background: "#FFFFFF",
                color: "#EF4444",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#EF4444";
                (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
                (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          </div>
          {accountFeedback && <FeedbackBanner feedback={accountFeedback} />}
        </div>

        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}