import Link from "next/link";
import { notFound } from "next/navigation";

import { HiringReadinessReport } from "@/components/hiring-readiness-report";
import { buttonVariants } from "@/components/ui/button";
import type { AnalysisRow } from "@/lib/database-types";
import { buildReportData } from "@/lib/report-utils";
import { createClient } from "@/lib/supabase/server";

type ReportPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Load one analysis from Supabase for the signed-in user only.
 */
async function getAnalysisForUser(
  id: string
): Promise<AnalysisRow | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;

  return data as AnalysisRow;
}

// Route: /reports/[id]
export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const analysis = await getAnalysisForUser(id);

  if (!analysis) {
    notFound();
  }

  const reportData = buildReportData(analysis);

  return (
    <div className="min-h-full bg-zinc-50 print:bg-white">
      <div className="no-print border-b bg-white px-4 py-3 sm:px-6">
        <Link
          href="/resume-analyzer"
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          ← Back to analyzer
        </Link>
      </div>
      <HiringReadinessReport data={reportData} />
    </div>
  );
}
