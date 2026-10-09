import { GoogleGenAI } from "@google/genai";

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
 * Machine-readable failure category. Provider errors keep their identity
 * instead of collapsing into one indistinguishable generic error.
 */
export type GeminiErrorKind =
  | "auth"
  | "quota"
  | "invalid-model"
  | "invalid-request"
  | "upstream"
  | "network"
  | "unknown";

/** Sanitized provider details. Safe for server logs; never user-facing. */
export interface ProviderDiagnostics {
  name: string;
  message: string;
  status?: number;
  code?: string | number;
  details?: unknown;
}

/**
 * Error with a user-safe message and the HTTP status the API route
 * should respond with. The original SDK error is preserved as `cause`
 * and its sanitized details live in `diagnostics` (server logs only).
 * Raw SDK messages are never forwarded to the frontend because
 * they may contain request details.
 */
export class GeminiError extends Error {
  status: number;
  kind: GeminiErrorKind;
  providerStatus?: number;
  diagnostics?: ProviderDiagnostics;
  constructor(
    message: string,
    status: number,
    options?: {
      kind?: GeminiErrorKind;
      cause?: unknown;
      providerStatus?: number;
      diagnostics?: ProviderDiagnostics;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "GeminiError";
    this.status = status;
    this.kind = options?.kind ?? "unknown";
    this.providerStatus = options?.providerStatus;
    this.diagnostics = options?.diagnostics;
  }
}

const SENSITIVE_KEY_PATTERN =
  /api[_-]?key|authorization|secret|token|bearer|cookie/i;

function sanitizeString(value: string): string {
  return (
    value
      // Google API keys (AIza...) embedded anywhere in text.
      .replace(/AIza[0-9A-Za-z_-]{10,}/g, "[REDACTED]")
      // ?key=... / &key=... query fragments.
      .replace(/([?&]key=)[^&\s"']+/gi, "$1[REDACTED]")
      // Bearer tokens.
      .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/=]+/gi, "$1[REDACTED]")
  );
}

/**
 * Deep-sanitizes an unknown value for logging: drops headers entirely,
 * redacts sensitive keys, scrubs key-like patterns from strings.
 */
export function sanitizeForLog(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[truncated]";
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (key.toLowerCase() === "headers") continue;
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = "[REDACTED]";
        continue;
      }
      out[key] = sanitizeForLog(item, depth + 1);
    }
    return out;
  }
  return value;
}

interface ProviderBody {
  code?: unknown;
  message?: unknown;
  status?: unknown;
  details?: unknown;
}

/**
 * The SDK's ApiError message embeds the provider response body as JSON,
 * e.g. {"error":{"code":429,"message":"...","status":"RESOURCE_EXHAUSTED"}}.
 */
function providerBodyFrom(rawMessage: string): ProviderBody | undefined {
  try {
    const parsed: unknown = JSON.parse(rawMessage);
    if (parsed !== null && typeof parsed === "object") {
      const record = parsed as Record<string, unknown>;
      const inner = record.error;
      const target =
        inner !== null && typeof inner === "object"
          ? (inner as Record<string, unknown>)
          : record;
      if ("code" in target || "message" in target || "status" in target) {
        return {
          code: target.code,
          message: target.message,
          status: target.status,
          details: target.details,
        };
      }
    }
  } catch {
    // Not a JSON body; fall back to the raw message.
  }
  return undefined;
}

function numericStatusOf(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d{3}$/.test(value.trim())) {
    return Number(value.trim());
  }
  return undefined;
}

/**
 * Extracts the SDK error's name, message, HTTP status, and provider
 * error details, sanitized for safe server-side logging.
 */
export function extractProviderDiagnostics(
  err: unknown
): ProviderDiagnostics {
  const name = err instanceof Error ? err.name : typeof err;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const holder =
    typeof err === "object" && err !== null
      ? (err as Record<string, unknown>)
      : {};

  const body = providerBodyFrom(rawMessage);
  const status =
    numericStatusOf(holder.status) ?? numericStatusOf(body?.code);

  let code: string | number | undefined;
  if (typeof body?.code === "string" || typeof body?.code === "number") {
    code = body.code;
  } else if (
    typeof holder.code === "string" ||
    typeof holder.code === "number"
  ) {
    code = holder.code;
  }

  const bodyMessage =
    typeof body?.message === "string" && body.message.length > 0
      ? body.message
      : rawMessage;

  return {
    name,
    message: sanitizeString(bodyMessage),
    status,
    code,
    details: sanitizeForLog(body?.details ?? holder.details ?? holder.error),
  };
}

function logGeminiDiagnostics(err: GeminiError): void {
  console.error("[Gemini] provider error:", {
    kind: err.kind,
    httpStatus: err.status,
    providerStatus: err.providerStatus,
    provider: err.diagnostics,
  });
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

  const diagnostics = extractProviderDiagnostics(err);
  const status = diagnostics.status;
  const rawMessage = err instanceof Error ? err.message : String(err);
  const mentionsKey = /api[_\s-]?key/i.test(rawMessage);

  const wrap = (
    message: string,
    httpStatus: number,
    kind: GeminiErrorKind
  ): GeminiError => {
    const mapped = new GeminiError(message, httpStatus, {
      kind,
      cause: err,
      providerStatus: status,
      diagnostics,
    });
    logGeminiDiagnostics(mapped);
    return mapped;
  };

  if (status === 429) {
    return wrap(
      "The AI analysis service is temporarily over its quota. Please wait a few minutes and try again.",
      429,
      "quota"
    );
  }
  if (status === 404) {
    return wrap(
      "The configured Gemini model is not available. Check the GEMINI_MODEL value and try again.",
      500,
      "invalid-model"
    );
  }
  if ((status === 400 && mentionsKey) || status === 401 || status === 403) {
    return wrap(
      "The AI analysis service rejected the server's API key. Check the server configuration and try again.",
      500,
      "auth"
    );
  }
  if (status !== undefined && status >= 500) {
    return wrap(
      "The AI analysis service failed. Please try again later.",
      502,
      "upstream"
    );
  }
  if (status === 400) {
    return wrap(
      "The AI analysis service rejected the request. Please try again later.",
      502,
      "invalid-request"
    );
  }

  if (isNetworkFailure(err)) {
    return wrap(
      "The AI analysis service could not be reached. Please try again later.",
      502,
      "network"
    );
  }

  return wrap(
    "The AI analysis service failed. Please try again later.",
    502,
    "unknown"
  );
}
