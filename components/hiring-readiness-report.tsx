import { PrintReportButton } from "@/components/print-report-button";
import { Badge } from "@/components/ui/badge";
import type { ReportData } from "@/lib/report-utils";
import { formatAnalysisDate, getScoreBadgeStyle } from "@/lib/score-utils";
import { cn } from "@/lib/utils";

type HiringReadinessReportProps = {
  data: ReportData;
};

/**
 * Color styles for the readiness verdict badge.
 */
function getVerdictStyles(verdict: ReportData["verdict"]): string {
  switch (verdict) {
    case "Ready":
      return "border-green-300 bg-green-50 text-green-900";
    case "Almost Ready":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "Needs Work":
      return "border-red-300 bg-red-50 text-red-900";
  }
}

/**
 * Full-page hiring readiness report — optimized for screen and print.
 */
export function HiringReadinessReport({ data }: HiringReadinessReportProps) {
  const scorePercent = Math.min(100, Math.max(0, data.atsScore));

  return (
    <article className="report-page mx-auto max-w-4xl bg-white px-6 py-8 sm:px-10 sm:py-12">
      {/* Toolbar — hidden when printing */}
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Generated {formatAnalysisDate(data.createdAt)}
        </p>
        <PrintReportButton />
      </div>

      {/* Report header */}
      <header className="report-header border-b border-zinc-200 pb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Hiring Readiness Report
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          {data.candidateName}
        </h1>
        <p className="mt-2 text-lg text-zinc-600">Applying for: {data.jobRole}</p>
        <p className="mt-1 text-sm text-zinc-500">
          Report date: {formatAnalysisDate(data.createdAt)}
        </p>
      </header>

      {/* ATS score */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          ATS match score
        </h2>
        <div className="mt-4 flex flex-wrap items-end gap-6">
          <p className="text-6xl font-bold tabular-nums text-zinc-900">
            {Math.round(data.atsScore)}
            <span className="text-2xl font-medium text-zinc-400">/100</span>
          </p>
          <Badge
            className={cn("border px-3 py-1 text-sm", getScoreBadgeStyle(data.atsScore))}
          >
            ATS score
          </Badge>
        </div>
        <div
          className="mt-4 h-4 w-full overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuenow={scorePercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              data.atsScore > 70 && "bg-green-500",
              data.atsScore >= 50 && data.atsScore <= 70 && "bg-amber-500",
              data.atsScore < 50 && "bg-red-500"
            )}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          {data.explanation}
        </p>
      </section>

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        {/* Strengths */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Top 3 strengths
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-800">
            {data.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ol>
        </section>

        {/* Gaps */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Top 3 gaps
          </h2>
          {data.gaps.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600">
              No major skill gaps were identified for this role.
            </p>
          ) : (
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-800">
              {data.gaps.map((gap, index) => (
                <li key={index}>{gap}</li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Improvement actions */}
      <section className="mt-10 rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          5 improvement actions
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-zinc-800">
          {data.improvementActions.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ol>
      </section>

      {/* Verdict */}
      <section className="report-verdict mt-10 rounded-xl border-2 border-zinc-900 bg-zinc-900 p-8 text-center text-white">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Readiness verdict
        </p>
        <p
          className={cn(
            "mt-4 inline-block rounded-full border px-8 py-3 text-2xl font-bold sm:text-3xl",
            getVerdictStyles(data.verdict)
          )}
        >
          {data.verdict}
        </p>
        <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-300">
          {data.verdict === "Ready" &&
            "This candidate shows strong alignment and is well positioned to advance in the hiring process."}
          {data.verdict === "Almost Ready" &&
            "With targeted improvements to the gaps below, this candidate could reach a competitive ATS score quickly."}
          {data.verdict === "Needs Work" &&
            "Significant resume updates are recommended before applying to similar roles."}
        </p>
      </section>

      <footer className="report-footer mt-10 border-t border-zinc-200 pt-6 text-center text-xs text-zinc-400">
        AI Resume Platform · Confidential hiring readiness summary
      </footer>
    </article>
  );
}
