import { describe, expect, it, vi, afterEach } from "vitest";
import {
  buildAnalysisContext,
  getRepositoryMetadata,
  GitHubError,
} from "@/lib/github";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetchOnce(response: { ok: boolean; status: number; json: unknown }) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: response.ok,
      status: response.status,
      json: async () => response.json,
    }))
  );
}

describe("getRepositoryMetadata", () => {
  it("maps GitHub fields to RepositoryInfo", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: {
        name: "react",
        description: "A library",
        default_branch: "main",
        stargazers_count: 10,
        language: "JavaScript",
        html_url: "https://github.com/facebook/react",
      },
    });
    const meta = await getRepositoryMetadata("facebook", "react");
    expect(meta.name).toBe("react");
    expect(meta.defaultBranch).toBe("main");
  });

  it("throws a friendly 404 error", async () => {
    mockFetchOnce({ ok: false, status: 404, json: {} });
    await expect(getRepositoryMetadata("no", "such")).rejects.toBeInstanceOf(
      GitHubError
    );
  });

  it("handles network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      })
    );
    await expect(getRepositoryMetadata("a", "b")).rejects.toThrow(
      /could not be reached/i
    );
  });
});

describe("buildAnalysisContext", () => {
  it("selects and truncates files within limits", async () => {
    const treeResponse = {
      tree: [
        { path: "README.md", type: "blob" },
        { path: "package.json", type: "blob" },
        { path: "logo.png", type: "blob" },
      ],
    };
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls += 1;
        if (String(url).includes("/git/trees/")) {
          return { ok: true, status: 200, json: async () => treeResponse };
        }
        return { ok: false, status: 404, json: async () => ({}) };
      })
    );
    expect(calls).toBe(0);
    const fetchFile = async (_o: string, _r: string, p: string) =>
      p === "logo.png" ? null : `# ${p}\ncontent`;
    // Stub the tree fetch indirectly by calling with a custom approach:
    // temporarily replace global fetch for tree only.
    const { getRepositoryTree } = await import("@/lib/github");
    const paths = await getRepositoryTree("o", "r", "main");
    expect(paths).not.toContain("logo.png");

    const context = await buildAnalysisContext("o", "r", "main", fetchFile);
    expect(context.files.length).toBeGreaterThan(0);
    expect(context.files[0].path).toBe("README.md");
  });

  it("rejects empty repositories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ tree: [] }),
      }))
    );
    await expect(buildAnalysisContext("o", "r", "main")).rejects.toThrow(
      /empty/
    );
  });
});
