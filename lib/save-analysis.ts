import type { CvAnalysisResult } from "@/lib/analysis-types";

/**
 * Persist a completed analysis to Supabase for the logged-in user.
 * Returns the new row id so we can link to the hiring readiness report.
 */
export async function saveAnalysisToDatabase(payload: {
  cvText: string;
  jobRole: string;
  atsScore: number;
  fullAnalysis: CvAnalysisResult;
}): Promise<
  { success: true; id: string } | { success: false; error: string }
> {
  try {
    const response = await fetch("/api/analyses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cvText: payload.cvText,
        jobRole: payload.jobRole,
        atsScore: payload.atsScore,
        fullAnalysis: payload.fullAnalysis,
      }),
    });

    const data = (await response.json()) as { id?: string; error?: string };

    if (!response.ok) {
      return {
        success: false,
        error: data.error ?? "Could not save analysis to your account.",
      };
    }

    if (!data.id) {
      return {
        success: false,
        error: "Analysis saved but no report id was returned.",
      };
    }

    return { success: true, id: data.id };
  } catch {
    return {
      success: false,
      error: "Could not save analysis. Check your connection and try again.",
    };
  }
}
