/**
 * Badge colors for ATS scores (used on dashboard and analyzer).
 */
export function getScoreBadgeStyle(score: number): string {
  if (score > 70) {
    return "border-green-200 bg-green-100 text-green-800";
  }
  if (score >= 50) {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }
  return "border-red-200 bg-red-100 text-red-800";
}

/**
 * Short label for an ATS score.
 */
export function getScoreLabel(score: number): string {
  if (score > 70) return "Strong match";
  if (score >= 50) return "Moderate match";
  return "Needs improvement";
}

/**
 * Format a database timestamp for display.
 */
export function formatAnalysisDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
