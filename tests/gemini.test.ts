import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@google/genai";
import { generateAnalysis } from "@/lib/analyzer";
import {
  GeminiError,
  extractProviderDiagnostics,
  getGeminiClient,
  getModel,
  resetGeminiClientForTests,
  sanitizeForLog,
  toGeminiError,
} from "@/lib/gemini";

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  ApiError: class ApiError extends Error {
    status: number;
    constructor({ message, status }: { message: string; status: number }) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
}));

function validPayload() {
  return {
    summary: "Fixture summary.",
    overallScore: 70,
    categories: {
      codeQuality: { score: 70, findings: ["f"], recommendations: ["r"] },
      architecture: { score: 65, findings: [], recommendations: [] },
      security: { score: 60, findings: [], recommendations: [] },
      testing: { score: 50, findings: [], recommendations: [] },
      documentation: { score: 80, findings: [], recommendations: [] },
      maintainability: { score: 75, findings: [], recommendations: [] },
    },
    priorityActions: ["Add tests."],
    limitations: ["Subset analyzed."],
  };
}

const SAVED_KEY = process.env.GEMINI_API_KEY;
const SAVED_MODEL = process.env.GEMINI_MODEL;

beforeEach(() => {
  mockGenerateContent.mockReset();
  resetGeminiClientForTests();
  process.env.GEMINI_API_KEY = "test-dummy-key";
  delete process.env.GEMINI_MODEL;
});

describe("getModel", () => {
  it("defaults to a stable Flash model", () => {
    expect(getModel()).toBe("gemini-3.8-flash");
  });

  it("respects the GEMINI_MODEL override", () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash-lite";
    expect(getModel()).toBe("gemini-3.5-flash-lite");
  });
});

describe("getGeminiClient", () => {
  it("throws a clear error when the key is missing", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => getGeminiClient()).toThrow(/GEMINI_API_KEY is not configured/);
  });
});

describe("generateAnalysis (mocked SDK, no network)", () => {
  it("returns validated analysis and sends system prompt as JSON request", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify(validPayload()),
    });
    const analysis = await generateAnalysis("o", "r", "ctx", 1, false);
    expect(analysis.overallScore).toBe(70);
    expect(mockGenerateContent).toHaveBeenCalledOnce();
    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-3.8-flash");
    expect(call.config.systemInstruction).toContain("RepoPilot");
    expect(call.config.responseMimeType).toBe("application/json");
  });

  it("rejects empty model output", async () => {
    mockGenerateContent.mockResolvedValue({ text: "" });
    await expect(generateAnalysis("o", "r", "ctx", 1, false)).rejects.toThrow(
      /empty response/
    );
  });

  it("rejects malformed model output", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not json" });
    await expect(generateAnalysis("o", "r", "ctx", 1, false)).rejects.toThrow(
      /invalid response/
    );
  });

  it("maps quota exhaustion to a retryable error", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError({ message: "Quota exceeded", status: 429 })
    );
    const err = await generateAnalysis("o", "r", "ctx", 1, false).catch(
      (e) => e
    );
    expect(err).toBeInstanceOf(GeminiError);
    expect((err as GeminiError).status).toBe(429);
    expect((err as Error).message).toMatch(/quota/i);
  });

  it("maps unknown models and auth failures without leaking details", async () => {
    mockGenerateContent.mockRejectedValue(
      new ApiError({ message: "models/xxx not found", status: 404 })
    );
    await expect(generateAnalysis("o", "r", "ctx", 1, false)).rejects.toThrow(
      /not available/
    );
    mockGenerateContent.mockRejectedValue(
      new ApiError({ message: "API key not valid", status: 400 })
    );
    await expect(generateAnalysis("o", "r", "ctx", 1, false)).rejects.toThrow(
      /rejected the server's API key/
    );
  });

  it("maps network failures to a reachability error", () => {
    const err = toGeminiError(new TypeError("fetch failed"));
    expect(err.status).toBe(502);
    expect(err.message).toMatch(/could not be reached/);
  });
});

describe("toGeminiError diagnostics (mocked, no network)", () => {
  it("preserves kind, cause, and provider status", () => {
    const sdkErr = new ApiError({ message: "Quota exceeded", status: 429 });
    const err = toGeminiError(sdkErr);
    expect(err.kind).toBe("quota");
    expect(err.status).toBe(429);
    expect(err.providerStatus).toBe(429);
    expect(err.cause).toBe(sdkErr);
    expect(err.diagnostics).toMatchObject({ name: "ApiError", status: 429 });
  });

  it("parses the provider JSON body carried by real SDK errors", () => {
    const body = JSON.stringify({
      error: {
        code: 429,
        message: "You exceeded your current quota",
        status: "RESOURCE_EXHAUSTED",
      },
    });
    const err = toGeminiError(new ApiError({ message: body, status: 429 }));
    expect(err.kind).toBe("quota");
    expect(err.diagnostics?.code).toBe(429);
    expect(err.diagnostics?.message).toBe("You exceeded your current quota");
  });

  it("maps upstream failures distinctly from quota and auth", () => {
    const upstream = toGeminiError(
      new ApiError({ message: "backend error", status: 503 })
    );
    expect(upstream.kind).toBe("upstream");
    expect(upstream.status).toBe(502);
    const unknown = toGeminiError(new Error("weird"));
    expect(unknown.kind).toBe("unknown");
    expect(unknown.status).toBe(502);
  });

  it("redacts secrets from diagnostics", () => {
    const fakeKey = "AIzaFakeTestKey1234567890abcdefghij";
    const err = toGeminiError(
      Object.assign(new Error(`request failed for ${fakeKey}`), {
        status: 500,
      })
    );
    const logged = JSON.stringify(err.diagnostics);
    expect(logged).not.toContain(fakeKey);
    expect(logged).toContain("[REDACTED]");
  });

  it("sanitizeForLog drops headers and redacts sensitive fields", () => {
    expect(
      sanitizeForLog({
        headers: { authorization: "Bearer hunter2" },
        apiKey: "sekret",
        nested: { token: "t", ok: 1 },
      })
    ).toEqual({
      apiKey: "[REDACTED]",
      nested: { token: "[REDACTED]", ok: 1 },
    });
  });

  it("extractProviderDiagnostics reports name, message, and status", () => {
    const diagnostics = extractProviderDiagnostics(
      new ApiError({ message: "bad model", status: 404 })
    );
    expect(diagnostics).toMatchObject({
      name: "ApiError",
      message: "bad model",
      status: 404,
    });
  });

  it("logs structured diagnostics without secrets", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      toGeminiError(new ApiError({ message: "Quota exceeded", status: 429 }));
      expect(spy).toHaveBeenCalledWith(
        "[Gemini] provider error:",
        expect.objectContaining({ kind: "quota", providerStatus: 429 })
      );
      expect(JSON.stringify(spy.mock.calls)).not.toMatch(/AIza|hunter2/);
    } finally {
      spy.mockRestore();
    }
  });
});

// Restore the developer's environment (never log secret values).
if (SAVED_KEY === undefined) delete process.env.GEMINI_API_KEY;
else process.env.GEMINI_API_KEY = SAVED_KEY;
if (SAVED_MODEL === undefined) delete process.env.GEMINI_MODEL;
else process.env.GEMINI_MODEL = SAVED_MODEL;
