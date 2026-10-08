import { describe, expect, it } from "vitest";
import {
  isRelevantFile,
  prioritizeFiles,
  truncateContent,
} from "@/lib/file-filter";

describe("isRelevantFile", () => {
  it("includes common source files", () => {
    expect(isRelevantFile("src/index.ts")).toBe(true);
    expect(isRelevantFile("app/page.tsx")).toBe(true);
    expect(isRelevantFile("main.py")).toBe(true);
  });

  it("includes docs and config files", () => {
    expect(isRelevantFile("README.md")).toBe(true);
    expect(isRelevantFile("README")).toBe(true);
    expect(isRelevantFile("docs/guide.md")).toBe(true);
    expect(isRelevantFile("package.json")).toBe(true);
  });

  it("ignores generated directories and binaries", () => {
    expect(isRelevantFile("node_modules/react/index.js")).toBe(false);
    expect(isRelevantFile("dist/bundle.js")).toBe(false);
    expect(isRelevantFile(".next/static/app.js")).toBe(false);
    expect(isRelevantFile("assets/logo.png")).toBe(false);
    expect(isRelevantFile("archive.zip")).toBe(false);
  });

  it("ignores lock files", () => {
    expect(isRelevantFile("package-lock.json")).toBe(false);
    expect(isRelevantFile("yarn.lock")).toBe(false);
  });
});

describe("prioritizeFiles", () => {
  it("prioritizes README first and respects the limit", () => {
    const paths = ["src/util.ts", "README.md", "package.json", "docs/a.md"];
    expect(prioritizeFiles(paths, 2)).toEqual(["README.md", "package.json"]);
  });
});

describe("truncateContent", () => {
  it("truncates oversized files", () => {
    const { content, truncated } = truncateContent("a".repeat(100), 10);
    expect(content).toHaveLength(10);
    expect(truncated).toBe(true);
  });

  it("keeps small files intact", () => {
    const { content, truncated } = truncateContent("hello", 100);
    expect(content).toBe("hello");
    expect(truncated).toBe(false);
  });
});
