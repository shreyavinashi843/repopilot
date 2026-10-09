import { ApiError, GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to .env.local to enable analysis."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function getModel(): string {
  return process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
}

/** Clears the cached client. Only used by tests. */
export function resetGeminiClientForTests(): void {
  client = null;
}

/**
 * Error with a user-safe message and the HTTP status the API route
 * should respond with. Raw SDK messages are never forwarded because
 * they may contain request details.
 */
export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isNetworkFailure(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const message = err instanceof Error ? err.message : String(err);
  return /fetch failed|network|ENOTFOUND|ECONNRESET|ETIMEDOUT|EAI_AGAIN/i.test(
    message
  );
}

export function toGeminiError(err: unknown): GeminiError {
  if (err instanceof GeminiError) return err;

  if (err instanceof ApiError || (err instanceof Error && "status" in err)) {
    const status =
      err instanceof ApiError
        ? err.status
        : Number((err as { status: unknown }).status);
    const detail = err instanceof Error ? err.message : "";
    const mentionsKey = /api[_\s-]?key/i.test(detail);

    if (status === 429) {
      return new GeminiError(
        "The AI analysis service is temporarily over its quota. Please wait a few minutes and try again.",
        429
      );
    }
    if (status === 404) {
      return new GeminiError(
        "The configured Gemini model is not available. Check the GEMINI_MODEL value and try again.",
        500
      );
    }
    if (status === 400 && mentionsKey) {
      return new GeminiError(
        "The AI analysis service rejected the server's API key. Check the server configuration and try again.",
        500
      );
    }
    if (status === 401 || status === 403) {
      return new GeminiError(
        "The AI analysis service rejected the server's API key. Check the server configuration and try again.",
        500
      );
    }
    if (status >= 500) {
      return new GeminiError(
        "The AI analysis service failed. Please try again later.",
        502
      );
    }
    if (status === 400) {
      return new GeminiError(
        "The AI analysis service rejected the request. Please try again later.",
        502
      );
    }
  }

  if (isNetworkFailure(err)) {
    return new GeminiError(
      "The AI analysis service could not be reached. Please try again later.",
      502
    );
  }

  return new GeminiError(
    "The AI analysis service failed. Please try again later.",
    502
  );
}
