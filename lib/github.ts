import {
  MAX_CHARS_PER_FILE,
  MAX_FILES_ANALYZED,
  MAX_TOTAL_CHARS,
  isIgnoredPath,
  prioritizeFiles,
  truncateContent,
} from "./file-filter";
import type { RepositoryInfo } from "@/types/analysis";

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

interface GitHubRepoResponse {
  name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  size: number;
}

interface GitHubTreeItem {
  path: string;
  type: string;
}

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "RepoPilot/0.1",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function friendlyError(status: number, owner: string, repo: string): GitHubError {
  if (status === 404) {
    return new GitHubError(
      `Repository "${owner}/${repo}" was not found. Check the URL and make sure it is a public repository.`,
      404
    );
  }
  if (status === 403) {
    return new GitHubError(
      "GitHub rate limit exceeded. Please wait a few minutes and try again.",
      403
    );
  }
  return new GitHubError(
    "GitHub could not be reached. Please try again later.",
    status
  );
}

export async function getRepositoryMetadata(
  owner: string,
  repo: string
): Promise<RepositoryInfo> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders(),
    });
  } catch {
    throw new GitHubError(
      "GitHub could not be reached. Please try again later.",
      502
    );
  }
  if (!res.ok) throw friendlyError(res.status, owner, repo);
  const data = (await res.json()) as GitHubRepoResponse;
  return {
    owner,
    name: data.name,
    description: data.description,
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    language: data.language,
    htmlUrl: data.html_url,
  };
}

export async function getRepositoryTree(
  owner: string,
  repo: string,
  branch: string
): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      { headers: githubHeaders() }
    );
  } catch {
    throw new GitHubError(
      "GitHub could not be reached. Please try again later.",
      502
    );
  }
  if (!res.ok) throw friendlyError(res.status, owner, repo);
  const data = (await res.json()) as { tree?: GitHubTreeItem[]; truncated?: boolean };
  const paths = (data.tree ?? [])
    .filter((item) => item.type === "blob" && !isIgnoredPath(item.path))
    .map((item) => item.path);
  if (paths.length === 0) {
    throw new GitHubError(
      "This repository appears to be empty or contains no analyzable files.",
      422
    );
  }
  return paths;
}

export async function getFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`,
      { headers: githubHeaders() }
    );
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const data = (await res.json()) as {
    content?: string;
    encoding?: string;
    size?: number;
  };
  if (!data.content || data.encoding !== "base64") return null;
  try {
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export interface AnalysisFile {
  path: string;
  content: string;
  truncated: boolean;
}

export interface AnalysisContext {
  files: AnalysisFile[];
  truncated: boolean;
  totalCandidateFiles: number;
}

export async function buildAnalysisContext(
  owner: string,
  repo: string,
  branch: string,
  fetchFile: typeof getFileContent = getFileContent
): Promise<AnalysisContext> {
  const allPaths = await getRepositoryTree(owner, repo, branch);
  const selected = prioritizeFiles(allPaths, MAX_FILES_ANALYZED);
  const truncated = selected.length < allPaths.length;

  const files: AnalysisFile[] = [];
  let totalChars = 0;

  for (const path of selected) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    const raw = await fetchFile(owner, repo, path);
    if (!raw) continue;
    const remaining = MAX_TOTAL_CHARS - totalChars;
    const budget = Math.min(MAX_CHARS_PER_FILE, remaining);
    const { content, truncated: fileTruncated } = truncateContent(raw, budget);
    files.push({ path, content, truncated: fileTruncated });
    totalChars += content.length;
  }

  if (files.length === 0) {
    throw new GitHubError(
      "Unable to retrieve repository contents. The repository may be empty.",
      422
    );
  }

  return { files, truncated: truncated || totalChars >= MAX_TOTAL_CHARS, totalCandidateFiles: allPaths.length };
}

export function formatContextForPrompt(context: AnalysisContext): string {
  return context.files
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
    .join("\n\n");
}
