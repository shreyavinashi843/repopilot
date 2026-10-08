// Limits are configurable via environment variables; defaults keep LLM
// context bounded so large repositories only contribute a subset.

export const MAX_FILES_ANALYZED = Number(
  process.env.REPOPILOT_MAX_FILES ?? 40
);
export const MAX_CHARS_PER_FILE = Number(
  process.env.REPOPILOT_MAX_CHARS_PER_FILE ?? 12000
);
export const MAX_TOTAL_CHARS = Number(
  process.env.REPOPILOT_MAX_TOTAL_CHARS ?? 100000
);

const INCLUDED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".cpp", ".c", ".h", ".hpp",
  ".go", ".rs", ".rb", ".php", ".cs", ".swift", ".kt", ".kts", ".sh",
  ".sql", ".css", ".scss", ".html", ".vue", ".svelte", ".json", ".yml",
  ".yaml", ".toml", ".xml", ".md",
]);

const INCLUDED_FILENAMES = new Set([
  "dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "makefile",
]);

const IGNORED_DIR_SEGMENTS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage",
  "vendor", "target", "bin", "obj", ".cache", "__pycache__", ".venv",
  "venv", "Pods", ".gradle", ".idea", ".vscode",
]);

const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip",
  ".tar", ".gz", ".mp4", ".mp3", ".woff", ".woff2", ".ttf", ".exe",
  ".dll", ".so", ".dylib", ".bin", ".lock", ".map",
]);

const LOCK_FILENAMES = new Set([
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "cargo.lock",
  "poetry.lock",
  "gemfile.lock",
]);

export function isIgnoredPath(path: string): boolean {
  const lower = path.toLowerCase();
  const segments = lower.split("/");
  if (segments.some((s) => IGNORED_DIR_SEGMENTS.has(s))) return true;
  const fileName = segments[segments.length - 1];
  if (LOCK_FILENAMES.has(fileName)) return true;
  const dot = fileName.lastIndexOf(".");
  if (dot !== -1 && IGNORED_EXTENSIONS.has(fileName.slice(dot))) return true;
  return false;
}

export function isRelevantFile(path: string): boolean {
  if (isIgnoredPath(path)) return false;
  const lower = path.toLowerCase();
  const fileName = lower.split("/").pop() ?? lower;
  if (INCLUDED_FILENAMES.has(fileName)) return true;
  if (fileName === "readme.md" || fileName === "contributing.md") return true;
  if (lower.startsWith("docs/")) return true;
  if (fileName.endsWith(".md")) return true;
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) {
    // Extensionless files: keep well-known doc/build entry points.
    return (
      fileName === "dockerfile" ||
      fileName === "makefile" ||
      fileName === "readme" ||
      fileName === "contributing" ||
      fileName === "license" ||
      fileName === "licence" ||
      fileName === "changelog"
    );
  }
  return INCLUDED_EXTENSIONS.has(fileName.slice(dot));
}

/** Lower number = higher priority for LLM context selection. */
export function priorityOf(path: string): number {
  const lower = path.toLowerCase();
  const fileName = lower.split("/").pop() ?? lower;
  if (fileName === "readme.md") return 0;
  if (
    [
      "package.json", "tsconfig.json", "pyproject.toml", "requirements.txt",
      "cargo.toml", "go.mod", "pom.xml", "build.gradle", ".env.example",
      "dockerfile", "docker-compose.yml",
    ].includes(fileName)
  ) {
    return 1;
  }
  if (
    lower.includes("src/index") ||
    lower.includes("src/main") ||
    lower.includes("src/app") ||
    fileName === "index.ts" ||
    fileName === "main.py" ||
    fileName === "main.go"
  ) {
    return 2;
  }
  if (lower.includes("test") || lower.includes("spec")) return 4;
  if (lower.startsWith("docs/") || fileName.endsWith(".md")) return 5;
  if (lower.startsWith("src/") || lower.startsWith("app/") || lower.startsWith("lib/")) {
    return 3;
  }
  return 6;
}

export function prioritizeFiles(paths: string[], limit: number): string[] {
  return [...paths]
    .filter(isRelevantFile)
    .sort((a, b) => {
      const p = priorityOf(a) - priorityOf(b);
      if (p !== 0) return p;
      return a.localeCompare(b);
    })
    .slice(0, limit);
}

export function truncateContent(
  content: string,
  maxChars: number = MAX_CHARS_PER_FILE
): { content: string; truncated: boolean } {
  if (content.length <= maxChars) return { content, truncated: false };
  return { content: content.slice(0, maxChars), truncated: true };
}
