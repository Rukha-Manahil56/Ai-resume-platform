import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
 * Load the signed-in user's 5 most recent analyses from Supabase.
 */
async function getRecentAnalyses(): Promise<AnalysisSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analyses")
    .select("id, job_role, ats_score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("[dashboard] fetch analyses:", error);
    return [];
  }

  return (data ?? []) as AnalysisSummary[];
}

// Route: / (Dashboard)
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const analyses = user ? await getRecentAnalyses() : [];

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Your recent resume analyses and ATS scores
        </p>
      </div>

      {!user && (
        <Card className="mb-8 max-w-lg">
          <CardHeader>
            <CardTitle>Sign in to save progress</CardTitle>
            <CardDescription>
              Create an account with Google to save analyses and view them here.
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
            <CardTitle>No analyses yet</CardTitle>
            <CardDescription>
              Run your first resume analysis to see results here.
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
                  <Badge
                    className={cn(
                      "border",
                      getScoreBadgeStyle(analysis.ats_score)
                    )}
                  >
                    {getScoreLabel(analysis.ats_score)}
                  </Badge>
                </div>
                <Link
                  href={`/reports/${analysis.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
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
