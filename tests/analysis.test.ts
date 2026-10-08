import { describe, expect, it } from "vitest";
import { analysisSchema } from "@/types/analysis";
import { parseAndValidateAnalysis } from "@/lib/analyzer";
import sample from "./fixtures/sample-analysis.json";

function validPayload() {
  return {
    summary: "Small sample project.",
    overallScore: 70,
    categories: {
      codeQuality: { score: 70, findings: ["a"], recommendations: ["b"] },
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

describe("analysis schema", () => {
  it("accepts a valid payload", () => {
    expect(analysisSchema.safeParse(validPayload()).success).toBe(true);
  });

  it("accepts the bundled fixture", () => {
    expect(analysisSchema.safeParse(sample).success).toBe(true);
  });

  it("rejects out-of-range scores", () => {
    const payload = validPayload();
    payload.overallScore = 150;
    expect(analysisSchema.safeParse(payload).success).toBe(false);
  });

  it("parses JSON with markdown fences", () => {
    const raw = "```json\n" + JSON.stringify(validPayload()) + "\n```";
    expect(parseAndValidateAnalysis(raw).overallScore).toBe(70);
  });

  it("rejects invalid JSON with a human-readable error", () => {
    expect(() => parseAndValidateAnalysis("not json")).toThrow(
      /invalid response/i
    );
  });
});
