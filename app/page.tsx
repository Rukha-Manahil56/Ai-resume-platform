"use client";
import Link from "next/link";
import {
  FileText,
  Brain,
  Mic,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Upload,
  Briefcase,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e8e8e8",
          height: "60px",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: "28px",
              height: "28px",
              background: "#0a0a0a",
              borderRadius: "7px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
            </svg>
          </div>
          <span style={{ fontWeight: 650, fontSize: "15px", letterSpacing: "-0.02em", color: "#0a0a0a" }}>
            CareerLens
          </span>
        </div>

        {/* Nav links — hidden on mobile */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "Mock Interview", "Reports"].map((label) => (
            <span
              key={label}
              style={{ fontSize: "13.5px", color: "#555", fontWeight: 450, cursor: "default", letterSpacing: "-0.01em" }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            style={{
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#444",
              padding: "6px 14px",
              borderRadius: "8px",
              transition: "background 0.15s",
            }}
            className="hover:bg-gray-100"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            style={{
              fontSize: "13.5px",
              fontWeight: 550,
              color: "#fff",
              background: "#0a0a0a",
              padding: "7px 16px",
              borderRadius: "8px",
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-80"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col lg:flex-row items-center justify-between gap-12 px-6 sm:px-10 lg:px-16"
        style={{ paddingTop: "120px", paddingBottom: "96px", maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* Left — copy */}
        <div className="flex-1 max-w-xl">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 mb-7"
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#888",
            }}
          >
            <span style={{ width: "20px", height: "1px", background: "#bbb", display: "inline-block" }} />
            Resume & Interview Intelligence
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: "-0.04em",
              color: "#0a0a0a",
              marginBottom: "24px",
            }}
          >
            Build a resume
            <br />
            that gets you{" "}
            <span
              style={{
                display: "inline-block",
                borderBottom: "3px solid #0a0a0a",
                paddingBottom: "1px",
              }}
            >
              interviewed.
            </span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: "1.05rem",
              color: "#555",
              lineHeight: 1.75,
              marginBottom: "36px",
              maxWidth: "460px",
            }}
          >
            Analyze your CV, discover missing skills, generate role-specific
            improvements, and practice realistic interviews — all in one focused
            career platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-10">
            <Link
              href="/resume-analyzer"
              className="group inline-flex items-center gap-2"
              style={{
                background: "#0a0a0a",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 550,
                padding: "11px 22px",
                borderRadius: "10px",
                letterSpacing: "-0.01em",
                transition: "opacity 0.15s",
              }}
            >
              Analyze my resume
              <ArrowRight
                size={15}
                style={{ transition: "transform 0.2s" }}
                className="group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              href="/mock-interview"
              style={{
                background: "#fff",
                color: "#0a0a0a",
                fontSize: "14px",
                fontWeight: 500,
                padding: "11px 22px",
                borderRadius: "10px",
                border: "1px solid #d8d8d8",
                letterSpacing: "-0.01em",
                transition: "border-color 0.15s",
              }}
              className="hover:border-gray-400"
            >
              Try mock interview
            </Link>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              "ATS scoring",
              "Skill gap analysis",
              "Interview prep",
              "Personalized reports",
            ].map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5"
                style={{ fontSize: "12.5px", color: "#888", fontWeight: 450 }}
              >
                <CheckCircle2 size={13} style={{ color: "#aaa" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right — dashboard preview card */}
        <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
          <DashboardPreview />
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── How it works ── */}
      <section
        className="px-6 sm:px-10"
        style={{ paddingTop: "88px", paddingBottom: "88px", background: "#fafafa" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Header */}
          <div className="mb-14">
            <p
              style={{
                fontSize: "11.5px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#888",
                marginBottom: "12px",
              }}
            >
              How it works
            </p>
            <h2
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)",
                fontWeight: 750,
                letterSpacing: "-0.03em",
                color: "#0a0a0a",
                lineHeight: 1.2,
                maxWidth: "500px",
              }}
            >
              From upload to offer,
              <br />
              in five steps.
            </h2>
          </div>

          {/* Steps grid */}
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-5" style={{ background: "#e8e8e8", borderRadius: "14px", overflow: "hidden" }}>
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                style={{
                  background: "#fafafa",
                  padding: "28px 24px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "#bbb",
                    marginBottom: "20px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    background: i === 4 ? "#0a0a0a" : "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <step.icon size={16} style={{ color: i === 4 ? "#fff" : "#444" }} />
                </div>
                <p
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: "#0a0a0a",
                    letterSpacing: "-0.015em",
                    marginBottom: "6px",
                  }}
                >
                  {step.title}
                </p>
                <p style={{ fontSize: "12.5px", color: "#888", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── Features ── */}
      <section
        className="px-6 sm:px-10"
        style={{ paddingTop: "88px", paddingBottom: "88px", background: "#fff" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Header */}
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p
                style={{
                  fontSize: "11.5px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#888",
                  marginBottom: "12px",
                }}
              >
                Features
              </p>
              <h2
                style={{
                  fontSize: "clamp(1.7rem, 3.5vw, 2.4rem)",
                  fontWeight: 750,
                  letterSpacing: "-0.03em",
                  color: "#0a0a0a",
                  lineHeight: 1.2,
                }}
              >
                Everything you need
                <br />
                to land the role.
              </h2>
            </div>
            <Link
              href="/resume-analyzer"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto"
              style={{ fontSize: "13.5px", color: "#555", fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              Start free <ArrowRight size={14} />
            </Link>
          </div>

          {/* Feature cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} {...f} large={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: "1px solid #f0f0f0" }} />

      {/* ── Final CTA ── */}
      <section
        className="px-6 sm:px-10"
        style={{ paddingTop: "96px", paddingBottom: "96px", background: "#0a0a0a" }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <p
            style={{
              fontSize: "11.5px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#555",
              marginBottom: "20px",
            }}
          >
            Get started today
          </p>
          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 750,
              letterSpacing: "-0.04em",
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: "20px",
            }}
          >
            Ready to improve your
            <br />
            next application?
          </h2>
          <p style={{ color: "#666", fontSize: "1rem", lineHeight: 1.7, marginBottom: "36px" }}>
            Join thousands of job seekers who use CareerLens to close the gap
            between their resume and their dream role.
          </p>
          <Link
            href="/resume-analyzer"
            className="inline-flex items-center gap-2 group"
            style={{
              background: "#fff",
              color: "#0a0a0a",
              fontSize: "14px",
              fontWeight: 600,
              padding: "13px 28px",
              borderRadius: "10px",
              letterSpacing: "-0.01em",
              transition: "opacity 0.15s",
            }}
          >
            Start free analysis
            <ArrowRight size={15} className="group-hover:translate-x-0.5" style={{ transition: "transform 0.2s" }} />
          </Link>

          {/* Micro social proof */}
          <div className="flex items-center justify-center gap-6 mt-12">
            {[
              { value: "50k+", label: "CVs analyzed" },
              { value: "87%", label: "Avg ATS improvement" },
              { value: "3×", label: "More interviews" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "11.5px", color: "#555", marginTop: "4px", fontWeight: 450 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: "#0a0a0a",
          borderTop: "1px solid #1c1c1c",
          padding: "24px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "12.5px", color: "#444", fontWeight: 450 }}>
          © 2026 CareerLens. All rights reserved.
        </span>
        <div className="flex items-center gap-6">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <span key={l} style={{ fontSize: "12.5px", color: "#444", fontWeight: 450, cursor: "default" }}>
              {l}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}

/* ── Dashboard Preview Card ── */
function DashboardPreview() {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e4e4e4",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.07)",
      }}
    >
      {/* Card header bar */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#fafafa",
        }}
      >
        <div style={{ display: "flex", gap: "5px" }}>
          {["#f0f0f0", "#e0e0e0", "#d0d0d0"].map((c) => (
            <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
          ))}
        </div>
        <span style={{ fontSize: "12px", color: "#aaa", marginLeft: "6px", fontWeight: 450 }}>
          careerlens.app / report
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "22px 20px" }}>
        {/* File name row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "#f5f5f5",
                border: "1px solid #eee",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={15} style={{ color: "#888" }} />
            </div>
            <div>
              <p style={{ fontSize: "12.5px", fontWeight: 600, color: "#0a0a0a", lineHeight: 1.2 }}>
                my_resume.pdf
              </p>
              <p style={{ fontSize: "11px", color: "#aaa", lineHeight: 1.2 }}>Senior Software Engineer</p>
            </div>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              background: "#f0faf4",
              color: "#2d7a4f",
              padding: "3px 10px",
              borderRadius: "20px",
              border: "1px solid #c8ecd8",
            }}
          >
            Analyzed
          </span>
        </div>

        {/* ATS Score — large */}
        <div
          style={{
            background: "#0a0a0a",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "14px",
          }}
        >
          <p style={{ fontSize: "11px", color: "#666", fontWeight: 500, marginBottom: "8px" }}>
            ATS MATCH SCORE
          </p>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px" }}>
            <span
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.05em",
                lineHeight: 1,
              }}
            >
              87
            </span>
            <span style={{ fontSize: "1.2rem", color: "#555", fontWeight: 600, marginBottom: "4px" }}>
              / 100
            </span>
          </div>
          {/* Progress bar */}
          <div
            style={{
              marginTop: "12px",
              height: "4px",
              background: "#1e1e1e",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "87%",
                height: "100%",
                background: "#fff",
                borderRadius: "2px",
              }}
            />
          </div>
          <p style={{ fontSize: "11px", color: "#555", marginTop: "8px", fontWeight: 450 }}>
            Strong match for this role
          </p>
        </div>

        {/* Metric rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
          <MetricRow
            label="Interview readiness"
            value="92%"
            pill={{ text: "Excellent", color: "#2d7a4f", bg: "#f0faf4", border: "#c8ecd8" }}
          />
          <MetricRow
            label="Resume strength"
            value="Strong"
            pill={{ text: "Good", color: "#2d7a4f", bg: "#f0faf4", border: "#c8ecd8" }}
          />
        </div>

        {/* Missing Skills */}
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #f0f0f0",
            borderRadius: "10px",
            padding: "14px 16px",
          }}
        >
          <p style={{ fontSize: "11px", fontWeight: 600, color: "#888", marginBottom: "10px" }}>
            MISSING SKILLS
          </p>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["Docker", "CI/CD", "AWS"].map((skill) => (
              <span
                key={skill}
                style={{
                  fontSize: "11.5px",
                  fontWeight: 500,
                  background: "#fff",
                  border: "1px solid #e0e0e0",
                  color: "#444",
                  padding: "4px 10px",
                  borderRadius: "6px",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  pill,
}: {
  label: string;
  value: string;
  pill: { text: string; color: string; bg: string; border: string };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "#fafafa",
        border: "1px solid #f0f0f0",
        borderRadius: "8px",
      }}
    >
      <span style={{ fontSize: "12.5px", color: "#555", fontWeight: 450 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 650, color: "#0a0a0a" }}>{value}</span>
        <span
          style={{
            fontSize: "10.5px",
            fontWeight: 600,
            background: pill.bg,
            color: pill.color,
            border: `1px solid ${pill.border}`,
            padding: "2px 8px",
            borderRadius: "20px",
          }}
        >
          {pill.text}
        </span>
      </div>
    </div>
  );
}

/* ── Feature Card ── */
function FeatureCard({
  icon: Icon,
  title,
  desc,
  href,
  large,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block"
      style={{
        background: "#fafafa",
        border: "1px solid #ebebeb",
        borderRadius: "14px",
        padding: large ? "32px 28px" : "24px",
        textDecoration: "none",
        transition: "border-color 0.2s, box-shadow 0.2s",
        gridColumn: large ? "span 1" : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#c8c8c8";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#ebebeb";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: "38px",
          height: "38px",
          background: "#fff",
          border: "1px solid #e4e4e4",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "18px",
          transition: "background 0.2s",
        }}
      >
        <Icon size={17} style={{ color: "#333" }} />
      </div>
      <h3
        style={{
          fontSize: "14.5px",
          fontWeight: 650,
          color: "#0a0a0a",
          letterSpacing: "-0.02em",
          marginBottom: "7px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.65 }}>{desc}</p>
      <div
        className="flex items-center gap-1 mt-4"
        style={{ fontSize: "12.5px", fontWeight: 550, color: "#bbb", transition: "color 0.2s" }}
      >
        Open <ArrowRight size={13} />
      </div>
    </Link>
  );
}

/* ── Data ── */
const STEPS = [
  {
    icon: Upload,
    title: "Upload resume",
    desc: "Drop your PDF and we extract the text instantly in the browser.",
  },
  {
    icon: Briefcase,
    title: "Select job role",
    desc: "Choose from hundreds of titles so the AI knows what to benchmark against.",
  },
  {
    icon: ClipboardList,
    title: "Add job requirements",
    desc: "Paste the job description to get a precise ATS match score.",
  },
  {
    icon: BarChart3,
    title: "Get AI report",
    desc: "Receive your ATS score, skill gaps, and line-by-line improvements.",
  },
  {
    icon: MessageSquare,
    title: "Practice interview",
    desc: "Run a five-stage mock interview with real-time feedback.",
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: "Resume analyzer",
    desc: "Upload your CV and get an instant ATS match score against the job description you're targeting.",
    href: "/resume-analyzer",
  },
  {
    icon: BarChart3,
    title: "ATS match score",
    desc: "See exactly how well your resume ranks against ATS filters before you apply.",
    href: "/resume-analyzer",
  },
  {
    icon: Brain,
    title: "Missing skills detection",
    desc: "Discover which keywords and skills are holding you back and get prioritized recommendations.",
    href: "/resume-analyzer",
  },
  {
    icon: FileText,
    title: "CV improvement suggestions",
    desc: "Get line-by-line rewrites and targeted action items to strengthen every section.",
    href: "/resume-analyzer",
  },
  {
    icon: Mic,
    title: "Mock interview",
    desc: "Practice with a five-stage AI interviewer — Technical, Behavioral, Situational, and more.",
    href: "/mock-interview",
  },
  {
    icon: BarChart3,
    title: "Report history",
    desc: "Track every analysis over time and see how your ATS score improves across applications.",
    href: "/reports",
  },
];