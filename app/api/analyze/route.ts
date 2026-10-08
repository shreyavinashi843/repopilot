import { NextResponse } from "next/server";
import { analyzeRequestSchema } from "@/types/analysis";
import { parseGitHubRepoUrl } from "@/lib/validation";
import {
  GitHubError,
  buildAnalysisContext,
  formatContextForPrompt,
  getRepositoryMetadata,
} from "@/lib/github";
import { generateAnalysis } from "@/lib/analyzer";
import { getClientKey, isRateLimited } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (isRateLimited(getClientKey(req))) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with repositoryUrl." },
      { status: 400 }
    );
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A repository URL is required." },
      { status: 400 }
    );
  }

  let owner: string;
  let repo: string;
  try {
    ({ owner, repo } = parseGitHubRepoUrl(parsed.data.repositoryUrl));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid repository URL." },
      { status: 400 }
    );
  }

  try {
    const repository = await getRepositoryMetadata(owner, repo);
    const context = await buildAnalysisContext(
      owner,
      repo,
      repository.defaultBranch
    );
    const contextText = formatContextForPrompt(context);
    const analysis = await generateAnalysis(
      owner,
      repo,
      contextText,
      context.files.length,
      context.truncated
    );

    return NextResponse.json({
      repository,
      analysis,
      metadata: {
        filesAnalyzed: context.files.length,
        truncated: context.truncated,
        analyzedPaths: context.files.map((f) => f.path),
      },
    });
  } catch (err) {
    if (err instanceof GitHubError) {
      const status =
        err.status === 404 || err.status === 403 || err.status === 422
          ? err.status
          : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const isConfigError = message.includes("ANTHROPIC_API_KEY");
    return NextResponse.json(
      { error: isConfigError ? message : message },
      { status: isConfigError ? 500 : 500 }
    );
  }
}
