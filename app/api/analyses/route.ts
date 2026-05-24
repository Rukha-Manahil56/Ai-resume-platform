import { NextRequest, NextResponse } from "next/server";

import type { CvAnalysisResult } from "@/lib/analysis-types";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/analyses
 * Saves a completed CV analysis for the logged-in user.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to save an analysis." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      cvText?: string;
      jobRole?: string;
      atsScore?: number;
      fullAnalysis?: CvAnalysisResult;
    };

    const cvText = body.cvText?.trim();
    const jobRole = body.jobRole?.trim();
    const atsScore = body.atsScore;
    const fullAnalysis = body.fullAnalysis;

    if (!cvText || !jobRole || typeof atsScore !== "number" || !fullAnalysis) {
      return NextResponse.json(
        { error: "Missing required analysis fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        cv_text: cvText,
        job_role: jobRole,
        ats_score: Math.round(atsScore),
        full_analysis: fullAnalysis,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[analyses] insert error:", error);
      return NextResponse.json(
        { error: "Failed to save analysis. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("[analyses]", error);
    return NextResponse.json(
      { error: "Failed to save analysis." },
      { status: 500 }
    );
  }
}
