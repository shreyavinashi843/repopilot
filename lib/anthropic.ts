import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local to enable analysis."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
}
