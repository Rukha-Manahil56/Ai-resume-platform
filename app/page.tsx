import Link from "next/link";
import {
  FileText, Brain, Mic, BarChart3,
  ArrowRight, CheckCircle2, Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black">

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 sm:px-10"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white font-black text-xs">AI</span>
          </div>
          <span className="font-bold text-lg tracking-tight">ResumeIQ</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: "#555" }}
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: "#7C3AED", color: "white" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-36 pb-24 overflow-hidden">

        {/* Animated background blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>

        {/* Badge */}
        <div
          className="relative mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
          style={{ background: "#f5f0ff", color: "#7C3AED", border: "1px solid #ddd6fe" }}
        >
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Career Intelligence
        </div>

        {/* Headline */}
        <h1
          className="relative mb-6 max-w-4xl"
          style={{
            fontSize: "clamp(2.8rem,7vw,5rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            color: "#0a0a0a",
          }}
        >
          Get Hired{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #7C3AED, #5B21B6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Smarter,
          </span>{" "}
          Not Harder
        </h1>

        {/* Subtitle */}
        <p
          className="relative mb-10 max-w-xl"
          style={{ fontSize: "clamp(1rem,2.5vw,1.2rem)", color: "#555", lineHeight: 1.7 }}
        >
          Upload your CV, get an instant ATS match score, discover skill gaps,
          and practice interviews with an AI coach — all in one place.
        </p>

        {/* CTA buttons */}
        <div className="relative flex flex-col sm:flex-row items-center gap-3 mb-16">
          <Link
            href="/resume-analyzer"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "#7C3AED",
              color: "white",
              boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
            }}
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="px-7 py-3.5 rounded-xl text-base font-semibold border-2 transition-all hover:bg-gray-50 active:scale-95"
            style={{ borderColor: "#0a0a0a", color: "#0a0a0a" }}
          >
            Sign In
          </Link>
        </div>

        {/* Floating analysis cards */}
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-3xl">
          <FloatingCard label="ATS Score"         value="87%"  sub="Strong match"            color="#7C3AED" delay="0s"   />
          <FloatingCard label="Missing Skills"    value="3"    sub="React · Docker · AWS"    color="#0a0a0a" delay="0.4s" />
          <FloatingCard label="Interview Ready"   value="72%"  sub="Practice 2 more sessions" color="#5B21B6" delay="0.8s" />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-24 sm:px-10" style={{ background: "#fafafa" }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2
              style={{
                fontSize: "clamp(1.8rem,4vw,2.8rem)",
                fontWeight: 800,
                color: "#0a0a0a",
                letterSpacing: "-0.03em",
              }}
            >
              Everything you need to land the job
            </h2>
            <p
              className="mt-3 mx-auto max-w-lg"
              style={{ color: "#666", fontSize: "1.05rem", lineHeight: 1.7 }}
            >
              Our AI analyzes your resume against the job description and
              prepares you for every stage of the hiring process.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-24 sm:px-10 bg-white">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2
              style={{
                fontSize: "clamp(1.8rem,4vw,2.6rem)",
                fontWeight: 800,
                color: "#0a0a0a",
                letterSpacing: "-0.03em",
              }}
            >
              How it works
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: i === 1 ? "#7C3AED" : "#0a0a0a" }}
                >
                  {i + 1}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#0a0a0a" }}>
                  {step.title}
                </h3>
                <p style={{ color: "#666", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section
        className="px-6 py-24 sm:px-10 text-center"
        style={{ background: "#0a0a0a" }}
      >
        <h2
          className="mb-4 text-white"
          style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
        >
          Ready to get hired?
        </h2>
        <p className="mb-8 mx-auto max-w-md" style={{ color: "#999", fontSize: "1.05rem" }}>
          Join thousands of job seekers using AI to land their dream role.
        </p>
        <Link
          href="/resume-analyzer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "#7C3AED", color: "white", boxShadow: "0 4px 24px rgba(124,58,237,0.4)" }}
        >
          Start for Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-6 py-6 text-center"
        style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a" }}
      >
        <p style={{ color: "#555", fontSize: "0.85rem" }}>© 2025 ResumeIQ. All rights reserved.</p>
      </footer>

      <style>{`
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.10;
          animation: blobFloat 8s ease-in-out infinite;
        }
        .blob-1 { width:500px;height:500px;background:#7C3AED;top:-100px;left:-100px;animation-delay:0s; }
        .blob-2 { width:400px;height:400px;background:#5B21B6;top:100px;right:-80px;animation-delay:2.5s; }
        .blob-3 { width:300px;height:300px;background:#7C3AED;bottom:0;left:40%;animation-delay:5s; }
        @keyframes blobFloat {
          0%,100% { transform:translate(0,0) scale(1); }
          33%      { transform:translate(20px,-20px) scale(1.05); }
          66%      { transform:translate(-15px,15px) scale(0.97); }
        }
        @keyframes cardFloat {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-8px); }
        }
        .float-card { animation:cardFloat 4s ease-in-out infinite; }
        .feature-card { transition:transform 0.2s ease,box-shadow 0.2s ease; }
        .feature-card:hover { transform:translateY(-4px);box-shadow:0 12px 40px rgba(0,0,0,0.10); }
      `}</style>
    </div>
  );
}

function FloatingCard({ label, value, sub, color, delay }: {
  label: string; value: string; sub: string; color: string; delay: string;
}) {
  return (
    <div
      className="float-card flex flex-col gap-1 rounded-2xl px-6 py-4 text-left w-full sm:w-auto"
      style={{
        background: "white",
        border: "1px solid #ebebeb",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        animationDelay: delay,
        minWidth: "160px",
      }}
    >
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: "0.8rem", color: "#777" }}>{sub}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent, href }: {
  icon: React.ElementType; title: string; desc: string; accent: string; href: string;
}) {
  return (
    <Link href={href} className="feature-card block rounded-2xl p-6 bg-white"
      style={{ border: "1px solid #ebebeb", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", textDecoration: "none" }}>
      <div className="mb-4 w-10 h-10 rounded-xl flex items-center justify-center"
           style={{ background: accent + "18" }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0a0a0a", marginBottom: "0.4rem" }}>{title}</h3>
      <p style={{ fontSize: "0.88rem", color: "#777", lineHeight: 1.6 }}>{desc}</p>
      <div className="mt-3 flex items-center gap-1 text-sm font-semibold" style={{ color: accent }}>
        Open <ArrowRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  );
}

const FEATURES = [
  { icon: FileText, title: "Resume Analyzer",      desc: "Get an instant ATS match score against the job description.",            accent: "#7C3AED", href: "/resume-analyzer" },
  { icon: Brain,    title: "Skill Gap Analysis",   desc: "Discover which skills you're missing and get prioritized recommendations.", accent: "#0a0a0a", href: "/resume-analyzer" },
  { icon: Mic,      title: "Mock Interview",        desc: "Practice with an AI interviewer that asks role-specific questions.",      accent: "#7C3AED", href: "/mock-interview"  },
  { icon: BarChart3,title: "Readiness Report",     desc: "Get a full hiring readiness report with strengths and an action plan.",   accent: "#0a0a0a", href: "/reports"         },
];

const HOW_IT_WORKS = [
  { title: "Upload your CV",        desc: "Drop your PDF resume and paste the job description you're targeting." },
  { title: "AI analyzes everything", desc: "Our AI scores your CV, finds skill gaps, and generates tailored interview questions." },
  { title: "Get hired faster",      desc: "Follow your personalized action plan and practice until you're fully ready." },
];