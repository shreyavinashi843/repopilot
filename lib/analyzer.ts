import { analysisSchema, type Analysis } from "@/types/analysis";
import { getAnthropicClient, getModel } from "./anthropic";

export const SYSTEM_PROMPT = `You are RepoPilot, an AI code-review assistant.

Analyze the supplied GitHub repository context.

Your job is to identify practical, evidence-based observations about:
- code quality
- architecture
- security
- testing
- documentation
- maintainability

Rules:
- Do not claim to have inspected files that are not included in the context.
- Do not invent dependencies, vulnerabilities, test coverage, architecture, or implementation details.
- When making a finding, reference the relevant file path when possible.
- Distinguish clearly between observed evidence, reasonable inference, and recommendation.
- If evidence is insufficient for a category, write "Insufficient evidence from the analyzed files." and assign a neutral score of 50.
- Scores must be integers from 0 to 100.
- Return ONLY valid JSON matching the requested schema, with no markdown fences and no extra text.`;

export function buildAnalysisPrompt(
  owner: string,
  repo: string,
  contextText: string,
  filesAnalyzed: number,
  truncated: boolean
): string {
  const scopeNote = truncated
    ? `Note: this is a representative subset of ${filesAnalyzed} files (the repository exceeded the analysis limit). Do not claim the entire repository was analyzed.`
    : `Note: ${filesAnalyzed} files were analyzed.`;
  return `Repository: ${owner}/${repo}\n${scopeNote}\n\nRepository file context:\n\n${contextText}\n\nReturn JSON with exactly this shape:\n{\n  "summary": "string",\n  "overallScore": 0,\n  "categories": {\n    "codeQuality": { "score": 0, "findings": [], "recommendations": [] },\n    "architecture": { "score": 0, "findings": [], "recommendations": [] },\n    "security": { "score": 0, "findings": [], "recommendations": [] },\n    "testing": { "score": 0, "findings": [], "recommendations": [] },\n    "documentation": { "score": 0, "findings": [], "recommendations": [] },\n    "maintainability": { "score": 0, "findings": [], "recommendations": [] }\n  },\n  "priorityActions": [],\n  "limitations": []\n}`;
}

export function parseAndValidateAnalysis(raw: string): Analysis {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "The AI returned an invalid response. Please try again."
    );
  }
  const result = analysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "The AI returned an unexpected format. Please try again."
    );
  }
  return result.data;
}

export async function generateAnalysis(
  owner: string,
  repo: string,
  contextText: string,
  filesAnalyzed: number,
  truncated: boolean
): Promise<Analysis> {
  const anthropic = getAnthropicClient();
  let response;
  try {
    response = await anthropic.messages.create({
      model: getModel(),
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildAnalysisPrompt(
            owner,
            repo,
            contextText,
            filesAnalyzed,
            truncated
          ),
        },
      ],
    });
  } catch {
    throw new Error(
      "The AI analysis service failed. Please try again later."
    );
  }
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");
  if (!text) {
    throw new Error("The AI returned an empty response. Please try again.");
  }
  return parseAndValidateAnalysis(text);
}
