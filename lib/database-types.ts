import type { CvAnalysisResult } from "@/lib/analysis-types";

/** Row shape for the public.analyses table in Supabase */
export type AnalysisRow = {
  id: string;
  user_id: string;
  cv_text: string;
  job_role: string;
  ats_score: number;
  full_analysis: CvAnalysisResult;
  created_at: string;
};

/** Fields we show on dashboard cards (subset of AnalysisRow) */
export type AnalysisSummary = Pick<
  AnalysisRow,
  "id" | "job_role" | "ats_score" | "created_at"
>;
