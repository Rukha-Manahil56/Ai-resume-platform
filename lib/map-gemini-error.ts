import { ApiError } from "@google/genai";

import {
  GEMINI_BUSY_MESSAGE,
  GEMINI_UNAVAILABLE_CODE,
  type AnalyzeCvErrorResponse,
} from "@/lib/gemini-errors";

/**
 * True when Gemini is temporarily down or at capacity (503, UNAVAILABLE, overloaded).
 */
function isGeminiUnavailableError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 503 ||
    lower.includes("unavailable") ||
    lower.includes("overloaded") ||
    lower.includes("resource exhausted") ||
    lower.includes("resource_exhausted")
  );
}

/**
 * True for rate limits and quota errors.
 */
function isGeminiRateLimitError(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  );
}

/**
 * Turn SDK and network errors into safe API responses (shared by Gemini routes).
 */
export function mapGeminiError(
  error: unknown,
  fallbackMessage = "Request failed. Please try again.",
  modelName?: string
): { status: number; body: AnalyzeCvErrorResponse } {
  if (error instanceof ApiError) {
    const status = error.status ?? 500;
    const message = error.message ?? "Gemini API error.";

    if (isGeminiUnavailableError(status, message)) {
      return {
        status: 503,
        body: {
          error: GEMINI_BUSY_MESSAGE,
          code: GEMINI_UNAVAILABLE_CODE,
          retryable: true,
        },
      };
    }

    if (isGeminiRateLimitError(status, message)) {
      return {
        status: 429,
        body: {
          error: GEMINI_BUSY_MESSAGE,
          code: GEMINI_UNAVAILABLE_CODE,
          retryable: true,
        },
      };
    }

    if (status === 401 || status === 403) {
      return {
        status: 500,
        body: {
          error:
            "Invalid or unauthorized Gemini API key. Check GEMINI_API_KEY in .env.local.",
          retryable: false,
        },
      };
    }

    if (status === 404 && modelName) {
      return {
        status: 502,
        body: {
          error: `Model "${modelName}" is not available. Verify the model name in your Google AI project.`,
          retryable: false,
        },
      };
    }

    return {
      status: status >= 400 && status < 600 ? status : 500,
      body: {
        error: `Gemini request failed: ${message}`,
        retryable: status >= 500,
      },
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 502,
      body: {
        error: "Received invalid JSON from the AI. Please try again.",
        retryable: true,
      },
    };
  }

  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    if (
      lower.includes("fetch failed") ||
      lower.includes("network") ||
      lower.includes("econnreset") ||
      lower.includes("timeout")
    ) {
      return {
        status: 503,
        body: {
          error: GEMINI_BUSY_MESSAGE,
          code: GEMINI_UNAVAILABLE_CODE,
          retryable: true,
        },
      };
    }

    return {
      status: 500,
      body: { error: error.message, retryable: false },
    };
  }

  return {
    status: 500,
    body: { error: fallbackMessage, retryable: true },
  };
}
