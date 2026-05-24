import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalysisSummary } from "@/lib/database-types";
import { formatAnalysisDate, getScoreBadgeStyle, getScoreLabel } from "@/lib/score-utils";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

/**
 * Fetch all analyses for the dashboard-style reports list.
 */
async function getUserAnalyses(): Promise<AnalysisSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analyses")
    .select("id, job_role, ats_score, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[reports] fetch:", error);
    return [];
  }

  return (data ?? []) as AnalysisSummary[];
}

// Route: /reports
export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const analyses = user ? await getUserAnalyses() : [];

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-muted-foreground">
          Open a hiring readiness report from any saved analysis
        </p>
      </div>

      {!user && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Sign in to view and generate hiring readiness reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login" className={buttonVariants()}>
              Sign in with Google
            </Link>
          </CardContent>
        </Card>
      )}

      {user && analyses.length === 0 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>No reports yet</CardTitle>
            <CardDescription>
              Run a resume analysis first, then generate a report from the
              results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/resume-analyzer" className={buttonVariants()}>
              Go to Resume Analyzer
            </Link>
          </CardContent>
        </Card>
      )}

      {user && analyses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Card key={analysis.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{analysis.job_role}</CardTitle>
                <CardDescription>
                  {formatAnalysisDate(analysis.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end justify-between gap-2">
                  <p className="text-4xl font-bold tabular-nums">
                    {analysis.ats_score}
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      getScoreBadgeStyle(analysis.ats_score)
                    )}
                  >
                    {getScoreLabel(analysis.ats_score)}
                  </span>
                </div>
                <Link
                  href={`/reports/${analysis.id}`}
                  className={cn(buttonVariants(), "w-full")}
                >
                  View report
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
