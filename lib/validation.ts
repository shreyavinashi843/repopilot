export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

/**
 * Validate that a string is a public GitHub owner/repo URL and extract parts.
 * Accepts: https://github.com/owner/repo (with optional trailing slash,
 * .git suffix, extra path segments like /tree/main, and http variant).
 * Rejects profile/org URLs, non-GitHub hosts, and missing repo segments.
 */
export function parseGitHubRepoUrl(input: string): ParsedRepoUrl {
  const trimmed = input.trim().replace(/\/+$/, "");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      "Invalid repository URL. Expected format: https://github.com/owner/repository"
    );
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid repository URL. Only http(s) URLs are supported.");
  }

  if (url.hostname.toLowerCase() !== "github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) {
    throw new Error(
      "Invalid GitHub URL. Include both owner and repository, e.g. https://github.com/vercel/next.js"
    );
  }

  const [owner, rawRepo] = segments;

  // Reject reserved/non-repository paths such as /settings, /marketplace, etc.
  // A repo URL must start with two path segments; deeper paths are tolerated
  // (e.g. /owner/repo/tree/main) but the first two must look like names.
  const namePattern = /^[A-Za-z0-9_.-]+$/;
  if (!namePattern.test(owner) || !namePattern.test(rawRepo.replace(/\.git$/, ""))) {
    throw new Error("Invalid GitHub repository URL.");
  }

  const repo = rawRepo.replace(/\.git$/, "");

  return { owner, repo };
}
