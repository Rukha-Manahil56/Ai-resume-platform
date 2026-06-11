/** Shown when Gemini returns 503, UNAVAILABLE, or similar capacity errors */
export const GEMINI_BUSY_MESSAGE =
"Our AI is busy right now";

export const GEMINI_UNAVAILABLE_CODE = "AI SERVICE TEMPORARILY UNAVAILABLE";

export type AnalyzeCvErrorResponse = {
  error: string;
  code?: string;
  retryable?: boolean;
};
