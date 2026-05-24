/** Shown when Gemini returns 503, UNAVAILABLE, or similar capacity errors */
export const GEMINI_BUSY_MESSAGE =
  "Gemini is busy right now. Please try again in a few minutes.";

export const GEMINI_UNAVAILABLE_CODE = "GEMINI_UNAVAILABLE";

export type AnalyzeCvErrorResponse = {
  error: string;
  code?: string;
  retryable?: boolean;
};
