# RepoPilot

AI-powered GitHub repository analysis for developers.

RepoPilot analyzes public GitHub repositories and generates practical recommendations for code quality, architecture, security, testing, documentation, and maintainability.

> Early-stage open-source MVP. Public repositories only.

## Features

- Validate and parse public GitHub repository URLs
- Fetch repository metadata and file trees via the GitHub REST API
- Filter binaries, generated directories, and lock files
- Prioritize README, config, entry points, source, tests, and docs
- Bound LLM context (default: 40 files, 12k chars/file, ~100k chars total)
- Structured AI report validated with Zod
- Rendered report with per-category scores, findings, and recommendations
- Markdown export
- Simple in-memory API rate limiting

## How It Works

1. User submits a public GitHub repository URL.
2. The API validates the URL and extracts `owner`/`repo`.
3. Repository metadata is fetched from `api.github.com`.
4. The recursive file tree is fetched.
5. Irrelevant files are filtered; relevant files are prioritized.
6. A compact context is built within the configured character budget.
7. The context is sent to the Gemini API (server-side only).
8. The JSON response is validated with Zod and returned to the browser.

## Architecture

- `app/` — Next.js pages and API routes
- `components/` — React UI components
- `lib/github.ts` — GitHub REST API access
- `lib/file-filter.ts` — file relevance and prioritization
- `lib/analyzer.ts` — LLM prompt and response validation
- `lib/gemini.ts` — server-side Google Gemini client
- `lib/validation.ts` — GitHub URL parsing
- `lib/markdown.ts` — Markdown export
- `lib/rate-limit.ts` — lightweight in-memory rate limiter
- `types/analysis.ts` — Zod schemas and shared types

## Tech Stack

- Next.js 15, React 19, TypeScript (strict)
- Tailwind CSS 3
- Google GenAI TypeScript SDK (`@google/genai`)
- Zod validation
- Vitest for tests

## Getting Started

Prerequisites: Node.js 20+ and npm.

```bash
git clone <your-fork-or-repo-url>
cd repopilot
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

### API keys

- `GEMINI_API_KEY` (required): create one at Google AI Studio (`https://aistudio.google.com/apikey`) and add it to `.env.local`. The key is only used in server-side API routes and is never sent to the browser.
- `GITHUB_TOKEN` (optional): a personal access token with no scopes increases the GitHub public API quota. Create one at `https://github.com/settings/tokens`.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Server-side Google Gemini API key. |
| `GEMINI_MODEL` | No | Model override (default `gemini-3.8-flash`). |
| `GITHUB_TOKEN` | No | Optional GitHub token for higher rate limits. |
| `REPOPILOT_MAX_FILES` | No | Max files analyzed (default `40`). |
| `REPOPILOT_MAX_CHARS_PER_FILE` | No | Max chars per file (default `12000`). |
| `REPOPILOT_MAX_TOTAL_CHARS` | No | Max total context chars (default `100000`). |

Never commit real credentials. `.env`, `.env.local`, and `.env*.local` are gitignored.

## Usage

1. Start the dev server (`npm run dev`).
2. Enter a public repository URL, e.g. `https://github.com/vercel/next.js`.
3. Choose **Analyze Repository**.
4. Review per-category scores, findings, priority actions, and limitations.
5. Use **Export Markdown** to download the report.

## Project Structure

```text
app/            pages, docs page, analyze page, API route
components/     form, report, sections, loading/error states
lib/            github, analyzer, validation, filtering, markdown
types/          zod schemas and shared types
tests/          vitest suites and fixtures
.github/        CI workflow
```

## Security Considerations

- Gemini API key stays server-side; never prefixed with `NEXT_PUBLIC_`.
- All user input validated; only `github.com` owner/repo URLs accepted.
- LLM output validated with Zod before rendering.
- Repository code is never executed, installed, or run — files are read as text only.
- Request size and repository context are bounded.
- Simple in-memory rate limit: 10 requests/minute/IP. This is a single-instance MVP protection, not a distributed limiter.

## Limitations

- Public GitHub repositories only; no private repo or OAuth support.
- Large repositories are sampled (representative subset); the report says so explicitly.
- Analysis quality depends on the LLM and the files within the context budget.
- No historical analysis or repository comparison yet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Please also read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Roadmap

Phase 1 (current MVP):

- Public GitHub repository analysis
- Basic AI report
- Markdown export

Phase 2 (planned):

- GitHub pull request analysis
- Better repository file prioritization
- Improved testing analysis

Phase 3 (planned):

- Optional GitHub OAuth
- Historical analysis
- Repository comparison

## License

MIT — see [LICENSE](LICENSE).
