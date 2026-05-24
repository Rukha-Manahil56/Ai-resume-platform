import type { CvAnalysisResult } from "@/lib/analysis-types";
import type { AnalysisRow } from "@/lib/database-types";

export type ReadinessVerdict = "Ready" | "Almost Ready" | "Needs Work";

/**
 * Try to read the candidate's name from the first lines of the CV text.
 * Falls back to "Candidate" if no clear name is found.
 */
export function extractCandidateName(cvText: string): string {
  const lines = cvText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);

  for (const line of lines) {
    if (line.length < 3 || line.length > 60) continue;
    if (/@|https?:\/\/|linkedin|github|phone|tel:/i.test(line)) continue;
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(line)) continue;

    // Two to four capitalized words (e.g. "Jane Smith" or "Mary Ann Lee")
    const nameMatch = line.match(
      /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/
    );
    if (nameMatch) return nameMatch[0];
  }

  return "Candidate";
}

/**
 * Map ATS score to a hiring readiness label.
 */
export function getReadinessVerdict(atsScore: number): ReadinessVerdict {
  if (atsScore > 70) return "Ready";
  if (atsScore >= 50) return "Almost Ready";
  return "Needs Work";
}

/**
 * Pick the top 3 strengths from the analysis and CV content.
 */
export function getTopStrengths(
  analysis: CvAnalysisResult,
  cvText: string
): string[] {
  const strengths: string[] = [];

  if (analysis.atsScore >= 70) {
    strengths.push(
      "Strong alignment with the target role based on ATS keyword matching."
    );
  } else if (analysis.atsScore >= 50) {
    strengths.push(
      "Solid baseline profile with identifiable experience relevant to the role."
    );
  }

  // Pull achievement-style lines from the CV as concrete strengths
  const cvBullets = cvText
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 25 &&
        (line.startsWith("•") ||
          line.startsWith("-") ||
          line.startsWith("*") ||
          /^\d+\./.test(line))
    )
    .map((line) => line.replace(/^[-•*\d.]+\s*/, "").slice(0, 140));

  strengths.push(...cvBullets);

  // Use improvement areas as evidence of relevant experience
  for (const item of analysis.improvements) {
    if (strengths.length >= 3) break;
    strengths.push(`Demonstrated experience: ${item.suggestion}`);
  }

  const explanationLead = analysis.explanation
    .split(/[.!?]/)
    .map((s) => s.trim())
    .find((s) => s.length > 20);

  if (explanationLead && strengths.length < 3) {
    strengths.push(explanationLead);
  }

  return [...new Set(strengths)].slice(0, 3);
}

/**
 * Pick the top 3 skill gaps, prioritizing high-importance items.
 */
export function getTopGaps(analysis: CvAnalysisResult): string[] {
  const importanceOrder = { high: 0, medium: 1, low: 2 };

  return [...analysis.missingSkills]
    .sort(
      (a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]
    )
    .slice(0, 3)
    .map((skill) => skill.name);
}

/**
 * Return exactly 5 actionable improvements from the stored analysis.
 */
export function getImprovementActions(analysis: CvAnalysisResult): string[] {
  return analysis.improvements
    .slice(0, 5)
    .map((item) => item.suggestion);
}

/**
 * Build everything the report page needs from one database row.
 */
export function buildReportData(analysis: AnalysisRow) {
  const fullAnalysis = analysis.full_analysis;
  const atsScore = analysis.ats_score;

  return {
    id: analysis.id,
    candidateName: extractCandidateName(analysis.cv_text),
    jobRole: analysis.job_role,
    atsScore,
    createdAt: analysis.created_at,
    strengths: getTopStrengths(fullAnalysis, analysis.cv_text),
    gaps: getTopGaps(fullAnalysis),
    improvementActions: getImprovementActions(fullAnalysis),
    verdict: getReadinessVerdict(atsScore),
    explanation: fullAnalysis.explanation,
  };
}

export type ReportData = ReturnType<typeof buildReportData>;
