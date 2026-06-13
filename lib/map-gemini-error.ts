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
  console.warn("[Gemini] Service temporarily unavailable.");
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
  console.warn("[Gemini] Rate limit reached.");
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
          error:  "Our AI service is experiencing high demand right now. We're automatically retrying your request. If the issue persists, please try again in a few moments.",
          code: GEMINI_UNAVAILABLE_CODE,
          retryable: true,
        },
      };
    }

    if (isGeminiRateLimitError(status, message)) {
      return {
        status: 429,
        body: {
          error:  "Our AI service is experiencing high demand right now. We're automatically retrying your request. If the issue persists, please try again in a few moments.",
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
          error: "Something unexpected happened while communicating with the AI service. Please try again later.",
          retryable: false,
        },
      };
    }

    return {
      status: status >= 400 && status < 600 ? status : 500,
      body: {
        error: "Something unexpected happened while communicating with the AI service. Please try again later.",
        retryable: status >= 500,
      },
    };
  }

  if (error instanceof SyntaxError) {
    return {
      status: 502,
      body: {
        error: "Something unexpected happened while communicating with the AI service. Please try again later.",
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
          error:  "Our AI service is experiencing high demand right now. We're automatically retrying your request. If the issue persists, please try again in a few moments.",
          code: GEMINI_UNAVAILABLE_CODE,
          retryable: true,
        },
      };
    }

    return {
      status: 500,
      body: { error: "Something unexpected happened while communicating with the AI service. Please try again later.", retryable: false },
    };
  }

  return {
    status: 500,
    body: { error: "Something unexpected happened while communicating with the AI service. Please try again later.", retryable: true },
  };
}
