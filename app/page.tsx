"use client";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FileText, Brain, Mic, BarChart3, ArrowRight, CheckCircle2,
  Upload, Briefcase, ClipboardList, MessageSquare, X, Menu,
  Target, TrendingUp, Lightbulb, History,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Auth hook
───────────────────────────────────────────── */
function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);
  return isLoggedIn;
}

function useNavTo(isLoggedIn: boolean | null) {
  return useCallback(
    (destination: string) => {
      if (isLoggedIn) {
        window.location.href = destination;
      } else {
        window.location.href = `/login?redirect=${encodeURIComponent(destination)}`;
      }
    },
    [isLoggedIn]
  );
}

/* ─────────────────────────────────────────────
   Modal types
───────────────────────────────────────────── */
type ModalKey = "features" | "how-it-works" | "mock-interview" | "reports" | null;

/* ─────────────────────────────────────────────
   Base Modal wrapper
───────────────────────────────────────────── */
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", animation: "fadeIn 0.18s ease" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#fff", borderRadius: "18px", border: "1px solid #e4e4e4", width: "100%", maxWidth: "560px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.14)", animation: "slideUp 0.2s ease", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", width: "30px", height: "30px", background: "#f5f5f5", border: "1px solid #eee", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", zIndex: 1 }} aria-label="Close">
          <X size={14} />
        </button>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Features Modal
───────────────────────────────────────────── */
const FEATURE_ITEMS = [
  { icon: FileText,  title: "Resume Analyzer",           desc: "Upload your CV and get an instant ATS match score against the job description you're targeting." },
  { icon: Target,    title: "ATS Match Score",            desc: "See exactly how well your resume ranks against ATS filters before you apply." },
  { icon: Brain,     title: "Missing Skills Detection",   desc: "Discover which keywords and skills are holding you back and get prioritized recommendations." },
  { icon: Lightbulb, title: "CV Improvement Suggestions", desc: "Get line-by-line rewrites and targeted action items to strengthen every section." },
  { icon: Mic,       title: "Mock Interview",             desc: "Practice with a five-stage AI interviewer — Technical, Behavioral, Situational, and more." },
  { icon: History,   title: "Report History",             desc: "Track every analysis over time and see how your ATS score improves across applications." },
];

function FeaturesModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 28px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Platform</p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "4px" }}>Everything you need to land the role</h2>
        <p style={{ fontSize: "13.5px", color: "#888", lineHeight: 1.6, marginBottom: "24px" }}>Six integrated tools that take you from application to offer.</p>
      </div>
      <div style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {FEATURE_ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 16px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "12px" }}>
            <div style={{ width: "34px", height: "34px", flexShrink: 0, background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={15} style={{ color: "#444" }} />
            </div>
            <div>
              <p style={{ fontSize: "13.5px", fontWeight: 650, color: "#0a0a0a", marginBottom: "3px", letterSpacing: "-0.01em" }}>{title}</p>
              <p style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.6 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   How It Works Modal
───────────────────────────────────────────── */
const HOW_STEPS = [
  { n: 1, title: "Upload your resume",        desc: "Drop your PDF — text is extracted instantly in the browser. Nothing is stored until you run an analysis." },
  { n: 2, title: "Select a target job role",  desc: "Choose from hundreds of job titles so the AI knows what benchmark to compare your resume against." },
  { n: 3, title: "Paste the job description", desc: "Copy-paste the full job posting to get a precise keyword and skills match score." },
  { n: 4, title: "Get your AI report",        desc: "Receive your ATS score, a list of missing skills, and line-by-line improvement suggestions in seconds." },
  { n: 5, title: "Practice mock interviews",  desc: "Run a five-stage AI interview session — Introduction, Technical, Behavioral, Situational, and Closing." },
  { n: 6, title: "Track progress over time",  desc: "Every analysis is saved. Return any time to compare your scores and see how far you've come." },
];

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 28px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Workflow</p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "4px" }}>From upload to offer, in six steps</h2>
        <p style={{ fontSize: "13.5px", color: "#888", lineHeight: 1.6, marginBottom: "24px" }}>The entire process takes under two minutes to start.</p>
      </div>
      <div style={{ padding: "0 20px 28px", display: "flex", flexDirection: "column", gap: "0" }}>
        {HOW_STEPS.map((step, i) => (
          <div key={step.n} style={{ display: "flex", gap: "16px", position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: "30px", height: "30px", background: step.n === 1 ? "#0a0a0a" : "#f5f5f5", border: `1px solid ${step.n === 1 ? "#0a0a0a" : "#e8e8e8"}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: step.n === 1 ? "#fff" : "#aaa" }}>{step.n}</span>
              </div>
              {i < HOW_STEPS.length - 1 && <div style={{ width: "1px", flex: 1, background: "#eee", minHeight: "24px", margin: "4px 0" }} />}
            </div>
            <div style={{ paddingBottom: i < HOW_STEPS.length - 1 ? "16px" : "0", paddingTop: "4px" }}>
              <p style={{ fontSize: "13.5px", fontWeight: 650, color: "#0a0a0a", marginBottom: "4px", letterSpacing: "-0.01em" }}>{step.title}</p>
              <p style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.65 }}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Mock Interview Modal
───────────────────────────────────────────── */
function MockInterviewModal({ onClose, navTo }: { onClose: () => void; navTo: (dest: string) => void }) {
  const stages = ["Introduction", "Technical", "Behavioral", "Situational", "Closing"];
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 28px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>Practice</p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "4px" }}>AI Mock Interview</h2>
        <p style={{ fontSize: "13.5px", color: "#888", lineHeight: 1.6, marginBottom: "20px" }}>Practice with a role-specific AI interviewer that gives real-time feedback on every answer.</p>
      </div>
      <div style={{ padding: "0 20px", marginBottom: "20px" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#bbb", marginBottom: "10px" }}>5 interview stages</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
          {stages.map((s, i) => (
            <span key={s} style={{ fontSize: "12px", fontWeight: 550, padding: "5px 12px", borderRadius: "20px", background: i === 0 ? "#0a0a0a" : "#f5f5f5", color: i === 0 ? "#fff" : "#555", border: `1px solid ${i === 0 ? "#0a0a0a" : "#eee"}` }}>{s}</span>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {["Role-specific questions tailored to your target job", "Technical, behavioral, and situational question types", "Instant AI feedback after every answer", "Voice input supported — speak your answers", "Best used after analyzing your resume first"].map((point) => (
            <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <CheckCircle2 size={14} style={{ color: "#2d7a4f", flexShrink: 0, marginTop: "1px" }} />
              <span style={{ fontSize: "13px", color: "#555", lineHeight: 1.5 }}>{point}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px 24px", borderTop: "1px solid #f0f0f0" }}>
        <button onClick={() => { onClose(); navTo("/mock-interview"); }} style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", letterSpacing: "-0.01em" }}>
          Start Mock Interview <ArrowRight size={15} />
        </button>
        <p style={{ fontSize: "11.5px", color: "#bbb", textAlign: "center", marginTop: "8px" }}>Free to use · No credit card required</p>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Reports Modal
───────────────────────────────────────────── */
function ReportsModal({ onClose, navTo }: { onClose: () => void; navTo: (dest: string) => void }) {
  return (
    <Modal onClose={onClose}>
      <div style={{ padding: "28px 28px 0" }}>
        <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#aaa", marginBottom: "6px" }}>History</p>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 750, color: "#0a0a0a", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: "4px" }}>Report History</h2>
        <p style={{ fontSize: "13.5px", color: "#888", lineHeight: 1.6, marginBottom: "20px" }}>Every resume analysis is saved so you can track your improvement over time.</p>
      </div>
      <div style={{ padding: "0 20px", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {[
            { icon: TrendingUp, label: "ATS score over time",  desc: "See if your scores are improving with each new application." },
            { icon: Target,     label: "Career readiness",     desc: "Track your overall readiness score across all analyses." },
            { icon: BarChart3,  label: "Compare past results", desc: "Side-by-side comparison of all your previous analyses." },
            { icon: History,    label: "Full analysis archive", desc: "Every missing skill, suggestion, and interview question — saved." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ padding: "14px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "12px" }}>
              <div style={{ width: "28px", height: "28px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
                <Icon size={13} style={{ color: "#555" }} />
              </div>
              <p style={{ fontSize: "12.5px", fontWeight: 650, color: "#0a0a0a", marginBottom: "4px", letterSpacing: "-0.01em" }}>{label}</p>
              <p style={{ fontSize: "11.5px", color: "#aaa", lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px 24px", borderTop: "1px solid #f0f0f0" }}>
        <button onClick={() => { onClose(); navTo("/reports"); }} style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", letterSpacing: "-0.01em" }}>
          View Reports <ArrowRight size={15} />
        </button>
        <p style={{ fontSize: "11.5px", color: "#bbb", textAlign: "center", marginTop: "8px" }}>Sign in required to view your saved reports</p>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────
   Task 3 — Mobile Menu
   Slides down from the top on mobile only.
   Each item triggers the same modal/auth flow
   as the desktop nav.
───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: "Features",       modal: "features"       as ModalKey, dest: null          },
  { label: "How It Works",   modal: "how-it-works"   as ModalKey, dest: null          },
  { label: "Mock Interview", modal: "mock-interview" as ModalKey, dest: null          },
  { label: "Reports",        modal: "reports"        as ModalKey, dest: null          },
] as const;

function MobileMenu({
  open,
  onClose,
  onOpenModal,
  navTo,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  onOpenModal: (key: ModalKey) => void;
  navTo: (dest: string) => void;
  isLoggedIn: boolean | null;
}) {
  /* Lock body scroll while menu is open */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 89,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Slide-down panel */}
      <div
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 90,
          background: "#fff",
          borderBottom: "1px solid #e8e8e8",
          borderBottomLeftRadius: "20px",
          borderBottomRightRadius: "20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
          transform: open ? "translateY(0)" : "translateY(-110%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          overflow: "hidden",
        }}
      >
        {/* Menu header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "28px", height: "28px", background: "#0a0a0a", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
              </svg>
            </div>
            <span style={{ fontWeight: 650, fontSize: "15px", letterSpacing: "-0.02em", color: "#0a0a0a" }}>CareerLens</span>
          </div>
          <button
            onClick={onClose}
            style={{ width: "32px", height: "32px", background: "#f5f5f5", border: "1px solid #eee", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#888" }}
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* Nav links — each opens the same modal as desktop */}
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV_ITEMS.map(({ label, modal }) => (
            <button
              key={label}
              onClick={() => { onClose(); setTimeout(() => onOpenModal(modal), 150); }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "13px 16px",
                background: "none", border: "1px solid transparent",
                borderRadius: "10px", cursor: "pointer",
                fontFamily: "inherit", textAlign: "left",
                fontSize: "15px", fontWeight: 500, color: "#0a0a0a",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#f9f9f9";
                (e.currentTarget as HTMLElement).style.borderColor = "#eee";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "none";
                (e.currentTarget as HTMLElement).style.borderColor = "transparent";
              }}
            >
              {label}
              <ChevronRight size={15} style={{ color: "#ccc" }} />
            </button>
          ))}
        </div>

        {/* Auth CTA row */}
        <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f5f5f5" }}>
          {isLoggedIn ? (
            <button
              onClick={() => { onClose(); window.location.href = "/resume-analyzer"; }}
              style={{ width: "100%", background: "#0a0a0a", color: "#fff", border: "none", borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", letterSpacing: "-0.01em" }}
            >
              Go to dashboard <ArrowRight size={14} />
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={onClose}
                style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: "10px", border: "1px solid #e0e0e0", fontSize: "14px", fontWeight: 500, color: "#0a0a0a", textDecoration: "none" }}
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: "10px", background: "#0a0a0a", fontSize: "14px", fontWeight: 600, color: "#fff", textDecoration: "none", letterSpacing: "-0.01em" }}
              >
                Start Free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   ChevronRight — used inside MobileMenu
───────────────────────────────────────────── */
function ChevronRight({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────── */
export default function LandingPage() {
  const isLoggedIn = useAuth();
  const navTo = useNavTo(isLoggedIn);
  const [activeModal, setActiveModal] = useState<ModalKey>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeModal = () => setActiveModal(null);

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Modals ── */}
      {activeModal === "features"       && <FeaturesModal      onClose={closeModal} />}
      {activeModal === "how-it-works"   && <HowItWorksModal    onClose={closeModal} />}
      {activeModal === "mock-interview" && <MockInterviewModal onClose={closeModal} navTo={navTo} />}
      {activeModal === "reports"        && <ReportsModal        onClose={closeModal} navTo={navTo} />}

      {/* ── Task 3: Mobile menu ── */}
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenModal={(key) => setActiveModal(key)}
        navTo={navTo}
        isLoggedIn={isLoggedIn}
      />

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #e8e8e8", height: "60px" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center" style={{ width: "28px", height: "28px", background: "#0a0a0a", borderRadius: "7px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 650, fontSize: "15px", letterSpacing: "-0.02em", color: "#0a0a0a" }}>CareerLens</span>
        </div>

        {/* Desktop nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {(
            [
              { label: "Features",       modal: "features"       },
              { label: "How it works",   modal: "how-it-works"   },
              { label: "Mock Interview", modal: "mock-interview" },
              { label: "Reports",        modal: "reports"        },
            ] as { label: string; modal: ModalKey }[]
          ).map(({ label, modal }) => (
            <button
              key={label}
              onClick={() => setActiveModal(modal)}
              style={{ fontSize: "13.5px", color: "#555", fontWeight: 450, cursor: "pointer", letterSpacing: "-0.01em", background: "none", border: "none", padding: "4px 0", fontFamily: "inherit", borderBottom: "1px solid transparent", transition: "color 0.15s, border-color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#0a0a0a"; (e.currentTarget as HTMLElement).style.borderBottomColor = "#0a0a0a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderBottomColor = "transparent"; }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side: auth buttons (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-2">
          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login" style={{ fontSize: "13.5px", fontWeight: 500, color: "#444", padding: "6px 14px", borderRadius: "8px", transition: "background 0.15s" }} className="hover:bg-gray-100">
              Sign in
            </Link>
            <Link href="/login" style={{ fontSize: "13.5px", fontWeight: 550, color: "#fff", background: "#0a0a0a", padding: "7px 16px", borderRadius: "8px", letterSpacing: "-0.01em", transition: "opacity 0.15s" }} className="hover:opacity-80">
              Get started
            </Link>
          </div>

          {/*
           * Task 3: Hamburger button — visible only on mobile (md:hidden).
           * Toggles the MobileMenu slide-down panel.
           */}
          <button
            className="md:hidden flex items-center justify-center"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            style={{ width: "36px", height: "36px", background: "#f5f5f5", border: "1px solid #e8e8e8", borderRadius: "8px", cursor: "pointer", color: "#0a0a0a" }}
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col lg:flex-row items-center justify-between gap-12 px-6 sm:px-10 lg:px-16"
        style={{ paddingTop: "120px", paddingBottom: "96px", maxWidth: "1200px", margin: "0 auto" }}
      >
        <div className="flex-1 max-w-xl">
          <div className="inline-flex items-center gap-2 mb-7" style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888" }}>
            <span style={{ width: "20px", height: "1px", background: "#bbb", display: "inline-block" }} />
            Resume & Interview Intelligence
          </div>

          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", color: "#0a0a0a", marginBottom: "24px" }}>
            Build a resume<br />that gets you{" "}
            <span style={{ display: "inline-block", borderBottom: "3px solid #0a0a0a", paddingBottom: "1px" }}>interviewed.</span>
          </h1>

          <p style={{ fontSize: "1.05rem", color: "#555", lineHeight: 1.75, marginBottom: "36px", maxWidth: "460px" }}>
            Analyze your CV, discover missing skills, generate role-specific improvements, and practice realistic interviews — all in one focused career platform.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
            <button onClick={() => navTo("/resume-analyzer")} className="group inline-flex items-center gap-2"
              style={{ background: "#0a0a0a", color: "#fff", fontSize: "14px", fontWeight: 550, padding: "11px 22px", borderRadius: "10px", letterSpacing: "-0.01em", transition: "opacity 0.15s", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
              Analyze my resume <ArrowRight size={15} />
            </button>
            <button onClick={() => navTo("/mock-interview")}
              style={{ background: "#fff", color: "#0a0a0a", fontSize: "14px", fontWeight: 500, padding: "11px 22px", borderRadius: "10px", border: "1px solid #d8d8d8", letterSpacing: "-0.01em", transition: "border-color 0.15s", cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#999")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#d8d8d8")}>
              Try mock interview
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {["ATS scoring", "Skill gap analysis", "Interview prep", "Personalized reports"].map((t) => (
              <span key={t} className="flex items-center gap-1.5" style={{ fontSize: "12.5px", color: "#888", fontWeight: 450 }}>
                <CheckCircle2 size={13} style={{ color: "#aaa" }} />{t}
              </span>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
          <DashboardPreview />
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── How it works ── */}
      <section className="px-6 sm:px-10" style={{ paddingTop: "88px", paddingBottom: "88px", background: "#fafafa" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="mb-14">
            <p style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>How it works</p>
            <h2 style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 750, letterSpacing: "-0.03em", color: "#0a0a0a", lineHeight: 1.2, maxWidth: "500px" }}>
              From upload to offer,<br />in five steps.
            </h2>
          </div>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-5" style={{ background: "#e8e8e8", borderRadius: "14px", overflow: "hidden" }}>
            {STEPS.map((step, i) => (
              <div key={step.title} style={{ background: "#fafafa", padding: "28px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", color: "#bbb", marginBottom: "20px", fontVariantNumeric: "tabular-nums" }}>0{i + 1}</div>
                <div style={{ width: "36px", height: "36px", background: i === 4 ? "#0a0a0a" : "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                  <step.icon size={16} style={{ color: i === 4 ? "#fff" : "#444" }} />
                </div>
                <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#0a0a0a", letterSpacing: "-0.015em", marginBottom: "6px" }}>{step.title}</p>
                <p style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── Features ── */}
      <section className="px-6 sm:px-10" style={{ paddingTop: "88px", paddingBottom: "88px", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>Features</p>
              <h2 style={{ fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)", fontWeight: 750, letterSpacing: "-0.03em", color: "#0a0a0a", lineHeight: 1.2 }}>
                Everything you need<br />to land the role.
              </h2>
            </div>
            <button onClick={() => navTo("/resume-analyzer")} className="inline-flex items-center gap-1.5 self-start sm:self-auto"
              style={{ fontSize: "13.5px", color: "#555", fontWeight: 500, letterSpacing: "-0.01em", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Start free <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} large={i === 0} navTo={navTo} />)}
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── Final CTA ── */}
      <section className="px-6 sm:px-10" style={{ paddingTop: "96px", paddingBottom: "96px", background: "#0a0a0a" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#555", marginBottom: "20px" }}>Get started today</p>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 750, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.1, marginBottom: "20px" }}>
            Ready to improve your<br />next application?
          </h2>
          <p style={{ color: "#666", fontSize: "1rem", lineHeight: 1.7, marginBottom: "36px" }}>
            Join thousands of job seekers who use CareerLens to close the gap between their resume and their dream role.
          </p>
          <button onClick={() => navTo("/resume-analyzer")} className="inline-flex items-center gap-2 group"
            style={{ background: "#fff", color: "#0a0a0a", fontSize: "14px", fontWeight: 600, padding: "13px 28px", borderRadius: "10px", letterSpacing: "-0.01em", transition: "opacity 0.15s", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
            Start free analysis <ArrowRight size={15} />
          </button>
          <div className="flex items-center justify-center gap-6 mt-12">
            {[{ value: "50k+", label: "CVs analyzed" }, { value: "87%", label: "Avg ATS improvement" }, { value: "3×", label: "More interviews" }].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "11.5px", color: "#555", marginTop: "4px", fontWeight: 450 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#0a0a0a", borderTop: "1px solid #1c1c1c", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <span style={{ fontSize: "12.5px", color: "#444", fontWeight: 450 }}>© 2026 CareerLens. All rights reserved.</span>
        <div className="flex items-center gap-6">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <span key={l} style={{ fontSize: "12.5px", color: "#444", fontWeight: 450, cursor: "default" }}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard Preview Card (unchanged)
───────────────────────────────────────────── */
function DashboardPreview() {
  return (
    <div style={{ background: "#fff", border: "1px solid #e4e4e4", borderRadius: "16px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.07)" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "8px", background: "#fafafa" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          {["#f0f0f0", "#e0e0e0", "#d0d0d0"].map((c) => (
            <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "6px", fontWeight: 450 }}>careerlens.app / report</span>
      </div>
      <div style={{ padding: "22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", background: "#f5f5f5", border: "1px solid #eee", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={15} style={{ color: "#888" }} />
            </div>
            <div>
              <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#0a0a0a", lineHeight: 1.2 }}>my_resume.pdf</p>
              <p style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.2 }}>Senior Software Engineer</p>
            </div>
          </div>
          <span style={{ fontSize: "11px", fontWeight: 600, background: "#f0faf4", color: "#2d7a4f", padding: "3px 10px", borderRadius: "20px", border: "1px solid #c8ecd8" }}>Analyzed</span>
        </div>
        <div style={{ background: "#0a0a0a", borderRadius: "12px", padding: "20px", marginBottom: "14px" }}>
          <p style={{ fontSize: "11px", color: "#666", fontWeight: 500, marginBottom: "8px" }}>ATS MATCH SCORE</p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <span style={{ fontSize: "3rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>87</span>
            <span style={{ fontSize: "1.2rem", color: "#555", fontWeight: 600, marginBottom: "4px" }}>/ 100</span>
          </div>
          <div style={{ marginTop: "12px", height: "4px", background: "#1e1e1e", borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ width: "87%", height: "100%", background: "#fff", borderRadius: "2px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "8px", fontWeight: 450 }}>Strong match for this role</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          <MetricRow label="Interview readiness" value="92%" pill={{ text: "Excellent", color: "#2d7a4f", bg: "#f0faf4", border: "#c8ecd8" }} />
          <MetricRow label="Resume strength"     value="Strong" pill={{ text: "Good",      color: "#2d7a4f", bg: "#f0faf4", border: "#c8ecd8" }} />
        </div>
        <div style={{ background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "10px", padding: "14px 16px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "10px" }}>MISSING SKILLS</p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["Docker", "CI/CD", "AWS"].map((skill) => (
              <span key={skill} style={{ fontSize: "11.5px", fontWeight: 500, background: "#fff", border: "1px solid #e0e0e0", color: "#444", padding: "4px 10px", borderRadius: "6px" }}>{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, pill }: { label: string; value: string; pill: { text: string; color: string; bg: string; border: string } }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "8px" }}>
      <span style={{ fontSize: "12.5px", color: "#555", fontWeight: 450 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 650, color: "#0a0a0a" }}>{value}</span>
        <span style={{ fontSize: "10.5px", fontWeight: 600, background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`, padding: "2px 8px", borderRadius: "20px" }}>{pill.text}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature Card
───────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, href, large, navTo }: {
  icon: React.ElementType; title: string; desc: string;
  href: string; large?: boolean; navTo: (dest: string) => void;
}) {
  return (
    <button onClick={() => navTo(href)}
      style={{ background: "#fafafa", border: "1px solid #ebebeb", borderRadius: "14px", padding: large ? "32px 28px" : "24px", cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.2s, box-shadow 0.2s", textAlign: "left", width: "100%" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#c8c8c8"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ebebeb"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
      <div style={{ width: "38px", height: "38px", background: "#fff", border: "1px solid #e4e4e4", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" }}>
        <Icon size={17} style={{ color: "#333" }} />
      </div>
      <h3 style={{ fontSize: "14.5px", fontWeight: 650, color: "#0a0a0a", letterSpacing: "-0.02em", marginBottom: "7px", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.65 }}>{desc}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "16px", fontSize: "12.5px", fontWeight: 550, color: "#bbb" }}>
        Open <ArrowRight size={13} />
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const STEPS = [
  { icon: Upload,        title: "Upload resume",        desc: "Drop your PDF and we extract the text instantly in the browser." },
  { icon: Briefcase,     title: "Select job role",      desc: "Choose from hundreds of titles so the AI knows what to benchmark against." },
  { icon: ClipboardList, title: "Add job requirements", desc: "Paste the job description to get a precise ATS match score." },
  { icon: BarChart3,     title: "Get AI report",        desc: "Receive your ATS score, skill gaps, and line-by-line improvements." },
  { icon: MessageSquare, title: "Practice interview",   desc: "Run a five-stage mock interview with real-time feedback." },
];

const FEATURES = [
  { icon: FileText,  title: "Resume analyzer",            desc: "Upload your CV and get an instant ATS match score against the job description you're targeting.", href: "/resume-analyzer" },
  { icon: BarChart3, title: "ATS match score",            desc: "See exactly how well your resume ranks against ATS filters before you apply.", href: "/resume-analyzer" },
  { icon: Brain,     title: "Missing skills detection",   desc: "Discover which keywords and skills are holding you back and get prioritized recommendations.", href: "/resume-analyzer" },
  { icon: FileText,  title: "CV improvement suggestions", desc: "Get line-by-line rewrites and targeted action items to strengthen every section.", href: "/resume-analyzer" },
  { icon: Mic,       title: "Mock interview",             desc: "Practice with a five-stage AI interviewer — Technical, Behavioral, Situational, and more.", href: "/mock-interview" },
  { icon: BarChart3, title: "Report history",             desc: "Track every analysis over time and see how your ATS score improves across applications.", href: "/reports" },
];