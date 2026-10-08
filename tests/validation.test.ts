import { describe, expect, it } from "vitest";
import { parseGitHubRepoUrl } from "@/lib/validation";

describe("parseGitHubRepoUrl", () => {
  it("parses a standard repo URL", () => {
    expect(parseGitHubRepoUrl("https://github.com/facebook/react")).toEqual({
      owner: "facebook",
      repo: "react",
    });
  });

  it("parses dotted repo names and trailing slashes", () => {
    expect(parseGitHubRepoUrl("https://github.com/vercel/next.js/")).toEqual({
      owner: "vercel",
      repo: "next.js",
    });
  });

  it("strips .git suffix and tolerates extra path segments", () => {
    expect(
      parseGitHubRepoUrl("https://github.com/torvalds/linux.git")
    ).toEqual({ owner: "torvalds", repo: "linux" });
    expect(
      parseGitHubRepoUrl("https://github.com/vercel/next.js/tree/canary")
    ).toEqual({ owner: "vercel", repo: "next.js" });
  });

  it("rejects non-GitHub URLs", () => {
    expect(() => parseGitHubRepoUrl("https://gitlab.com/owner/repo")).toThrow(
      /Only github\.com/
    );
  });

  it("rejects malformed URLs", () => {
    expect(() => parseGitHubRepoUrl("not a url")).toThrow(/Invalid/);
  });

  it("rejects profile/org URLs without a repository", () => {
    expect(() => parseGitHubRepoUrl("https://github.com/vercel")).toThrow(
      /owner and repository/
    );
    expect(() => parseGitHubRepoUrl("https://github.com/")).toThrow();
  });
});
