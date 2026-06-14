"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  User,
  Mail,
  Shield,
  LogOut,
  Trash2,
  Bell,
  Palette,
  Cpu,
  Lock,
  ChevronRight,
  Monitor,
  Sun,
  Moon,
  Check,
  Settings,
  AlertTriangle,
  Link2,
  Database,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type AppearanceMode = "light" | "dark" | "system";
type AnalysisDetail = "basic" | "standard" | "advanced";

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
        {/* Profile skeleton */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "16px", padding: "24px" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl animate-pulse" style={{ background: "#F3F4F6", flexShrink: 0 }} />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton w="45%" h="18px" />
              <Skeleton w="60%" h="14px" />
              <Skeleton w="30%" h="12px" />
            </div>
          </div>
        </div>
        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
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
   Toggle Switch
───────────────────────────────────────────── */
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      style={{
        width: "42px",
        height: "24px",
        borderRadius: "999px",
        border: "none",
        cursor: "pointer",
        background: enabled ? "#111111" : "#E5E7EB",
        position: "relative",
        transition: "background 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: enabled ? "21px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left 0.2s ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }}
      />
    </button>
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
      {/* Card header */}
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
   Row — label + value/chevron
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
   Clickable Row
───────────────────────────────────────────── */
function ActionRow({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
      style={{
        background: hovered ? "#F3F4F6" : "#F8F9FA",
        border: "1px solid #E5E7EB",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span style={{ color: "#6B7280" }}>{icon}</span>
      <div className="flex-1">
        <p style={{ fontSize: "0.85rem", color: "#111111", fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1px" }}>{sub}</p>}
      </div>
      {onClick && <ChevronRight className="w-4 h-4" style={{ color: "#D1D5DB" }} />}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Notification Toggle Row
───────────────────────────────────────────── */
function NotifRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
      style={{ background: "#F8F9FA", border: "1px solid #E5E7EB" }}
    >
      <div>
        <p style={{ fontSize: "0.85rem", color: "#111111", fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: "0.75rem", color: "#9CA3AF", marginTop: "1px" }}>{sub}</p>
      </div>
      <Toggle enabled={value} onChange={onChange} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Segmented / Radio Cards
───────────────────────────────────────────── */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              border: active ? "1.5px solid #111111" : "1px solid #E5E7EB",
              background: active ? "#111111" : "#F8F9FA",
              borderRadius: "12px",
              padding: "12px 8px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F8F9FA";
            }}
          >
            {opt.icon && (
              <span style={{ color: active ? "#FFFFFF" : "#6B7280" }}>{opt.icon}</span>
            )}
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: active ? "#FFFFFF" : "#111111" }}>
              {opt.label}
            </span>
            {opt.sub && (
              <span style={{ fontSize: "0.68rem", color: active ? "#FFFFFF99" : "#9CA3AF" }}>
                {opt.sub}
              </span>
            )}
            {active && (
              <Check className="w-3 h-3" style={{ color: "#FFFFFF", marginTop: "-2px" }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function SettingsPage() {
  // ── Existing state — untouched ──
  const [user, setUser] = useState<{
    email?: string;
    user_metadata?: Record<string, string>;
    app_metadata?: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // ── New UI-only state ──
  const [appearance, setAppearance] = useState<AppearanceMode>("system");
  const [analysisDetail, setAnalysisDetail] = useState<AnalysisDetail>("standard");
  const [notifs, setNotifs] = useState({
    tips: true,
    progress: false,
    interview: true,
    updates: false,
  });
  const [heroVisible, setHeroVisible] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  // ── Existing load logic — untouched ──
  useEffect(() => {
    const supabase = createClient();
    async function load() {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
      setLoading(false);
    }
    void load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── Existing sign-out logic — untouched ──
  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  // ── Derived display values ──
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";
  const initials = getInitials(displayName);
  const provider =
    (user?.app_metadata?.provider as string | undefined) ?? "email";
  const providerLabel =
    provider === "google"
      ? "Google"
      : provider === "github"
      ? "GitHub"
      : "Email / Password";

  if (loading) return <SkeletonPage />;

  return (
    <div className="min-h-screen" style={{ background: "#F8F9FA" }}>
      <div className="max-w-2xl mx-auto px-6 py-12 sm:px-10 flex flex-col gap-5">

        {/* ── Page eyebrow + title ── */}
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
            Manage your profile, appearance, and workspace settings.
          </p>
        </div>

        {/* ── Profile Header Card ── */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "24px",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s",
          }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="flex items-center justify-center shrink-0 rounded-2xl text-xl font-black"
                style={{
                  width: "64px",
                  height: "64px",
                  background: "#111111",
                  color: "#FFFFFF",
                  letterSpacing: "-0.04em",
                }}
              >
                {initials}
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "#111111",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {displayName}
                </p>
                <p style={{ fontSize: "0.82rem", color: "#6B7280", marginTop: "2px" }}>
                  {user?.email}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#10B981",
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 500 }}>
                    Connected via {providerLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Plan badge */}
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "5px 12px",
                borderRadius: "999px",
                background: "#F3F4F6",
                color: "#6B7280",
                border: "1px solid #E5E7EB",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Free Plan
            </span>
          </div>
        </div>

        {/* ── Account ── */}
        <SectionCard
          icon={<Mail className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Account"
          description="Your account details and plan information."
          delay={160}
        >
          <div className="flex flex-col gap-2">
            <InfoRow label="Email address" value={user?.email ?? "—"} />
            <InfoRow
              label="Account plan"
              badge={{ text: "Free Plan", color: "#6B7280" }}
            />
            <InfoRow label="Login provider" value={providerLabel} />
          </div>
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard
          icon={<Palette className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Appearance"
          description="Choose how the interface looks for you."
          delay={220}
        >
          <SegmentedControl<AppearanceMode>
            value={appearance}
            onChange={setAppearance}
            options={[
              { value: "light", label: "Light", icon: <Sun className="w-4 h-4" />, sub: "Always light" },
              { value: "system", label: "System", icon: <Monitor className="w-4 h-4" />, sub: "Match OS" },
              { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" />, sub: "Always dark" },
            ]}
          />
        </SectionCard>

        {/* ── AI Preferences ── */}
        <SectionCard
          icon={<Cpu className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="AI Preferences"
          description="Control the depth of resume analysis output."
          delay={280}
        >
          <SegmentedControl<AnalysisDetail>
            value={analysisDetail}
            onChange={setAnalysisDetail}
            options={[
              { value: "basic", label: "Basic", sub: "Fast scan" },
              { value: "standard", label: "Standard", sub: "Balanced" },
              { value: "advanced", label: "Advanced", sub: "Deep dive" },
            ]}
          />
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard
          icon={<Bell className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Notifications"
          description="Choose what updates you want to receive."
          delay={340}
        >
          <div className="flex flex-col gap-2">
            <NotifRow
              label="Resume Improvement Tips"
              sub="Actionable suggestions after each analysis."
              value={notifs.tips}
              onChange={(v) => setNotifs((p) => ({ ...p, tips: v }))}
            />
            <NotifRow
              label="Weekly Career Progress"
              sub="A summary of your score trends every week."
              value={notifs.progress}
              onChange={(v) => setNotifs((p) => ({ ...p, progress: v }))}
            />
            <NotifRow
              label="Interview Reminders"
              sub="Practice prompts to keep your skills sharp."
              value={notifs.interview}
              onChange={(v) => setNotifs((p) => ({ ...p, interview: v }))}
            />
            <NotifRow
              label="Product Updates"
              sub="New features, improvements, and announcements."
              value={notifs.updates}
              onChange={(v) => setNotifs((p) => ({ ...p, updates: v }))}
            />
          </div>
        </SectionCard>

        {/* ── Privacy ── */}
        <SectionCard
          icon={<Lock className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Privacy"
          description="Control your data and connected services."
          delay={400}
        >
          <div className="flex flex-col gap-2">
            <ActionRow
              icon={<User className="w-4 h-4" />}
              label="Manage Account"
              sub="Update your name and profile details."
            />
            <ActionRow
              icon={<Link2 className="w-4 h-4" />}
              label="Connected Services"
              sub="Apps and integrations linked to your account."
            />
            <ActionRow
              icon={<Database className="w-4 h-4" />}
              label="Data Usage"
              sub="How your resume data is stored and processed."
            />
          </div>
        </SectionCard>

        {/* ── Security ── */}
        <SectionCard
          icon={<Shield className="w-4 h-4" style={{ color: "#6B7280" }} />}
          title="Security"
          description="Manage sessions and account protection."
          delay={460}
        >
          <div className="flex flex-col gap-2">
            <InfoRow label="Login provider" value={providerLabel} />
            <InfoRow label="Session" value="Active" />
            <InfoRow
              label="Account protection"
              badge={{ text: "Protected", color: "#10B981" }}
            />

            {/* Sign out — existing functionality preserved */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 mt-1"
              style={{
                background: "#F8F9FA",
                border: "1px solid #E5E7EB",
                color: "#111111",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#D1D5DB";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F8F9FA";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
              }}
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6B7280" }} />
              ) : (
                <LogOut className="w-4 h-4" style={{ color: "#6B7280" }} />
              )}
              <span>{signingOut ? "Signing out…" : "Sign out of all devices"}</span>
            </button>
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
            className="flex items-center justify-between gap-4 flex-wrap px-4 py-4 rounded-xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111111" }}>
                Delete Account
              </p>
              <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "2px" }}>
                This action cannot be undone. All your data will be permanently removed.
              </p>
            </div>
            <button
              onClick={() => setDeletePending(true)}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: "1.5px solid #EF4444",
                background: deletePending ? "#EF4444" : "#FFFFFF",
                color: deletePending ? "#FFFFFF" : "#EF4444",
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
                if (!deletePending) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#EF4444";
                  (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                }
              }}
              onMouseLeave={(e) => {
                if (!deletePending) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.color = "#EF4444";
                }
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deletePending ? "Are you sure?" : "Delete Account"}
            </button>
          </div>

          {/* Confirmation row */}
          {deletePending && (
            <div className="flex items-center gap-2 mt-3">
              <button
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "10px",
                  border: "1.5px solid #EF4444",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Yes, delete my account
              </button>
              <button
                onClick={() => setDeletePending(false)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: "10px",
                  border: "1px solid #E5E7EB",
                  background: "#F8F9FA",
                  color: "#6B7280",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Bottom spacer */}
        <div style={{ height: "24px" }} />
      </div>
    </div>
  );
}