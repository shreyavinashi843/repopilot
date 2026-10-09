export default function DocsPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-bold">Documentation</h1>

      <section aria-labelledby="usage">
        <h2 id="usage" className="text-xl font-semibold">
          Usage
        </h2>
        <p className="mt-2 text-slate-700">
          Enter a public GitHub repository URL such as{" "}
          <code className="rounded bg-slate-100 px-1">
            https://github.com/vercel/next.js
          </code>{" "}
          and choose Analyze. RepoPilot fetches repository metadata and a
          bounded subset of files, then requests a structured report from the
          configured LLM.
        </p>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-xl font-semibold">
          How it works
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-slate-700">
          <li>Validate the URL and extract owner/repository.</li>
          <li>Fetch repository metadata from the GitHub REST API.</li>
          <li>Fetch the recursive file tree.</li>
          <li>Filter out binaries, lock files, and generated directories.</li>
          <li>Prioritize README, config, entry points, source, tests, docs.</li>
          <li>Build a compact context (max ~40 files, ~100k characters).</li>
          <li>Send the context to the Gemini API server-side only.</li>
          <li>Validate the JSON response with Zod and render the report.</li>
        </ol>
      </section>

      <section aria-labelledby="env">
        <h2 id="env" className="text-xl font-semibold">
          Environment variables
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
          <li>
            <code className="rounded bg-slate-100 px-1">GEMINI_API_KEY</code>{" "}
            (required) — server-side Google Gemini API key. Get one from
            Google AI Studio.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">GEMINI_MODEL</code>{" "}
            (optional) — defaults to gemini-3.8-flash.
          </li>
          <li>
            <code className="rounded bg-slate-100 px-1">GITHUB_TOKEN</code>{" "}
            (optional) — increases GitHub rate limits for public repositories.
          </li>
        </ul>
      </section>

      <section aria-labelledby="limits">
        <h2 id="limits" className="text-xl font-semibold">
          Limits
        </h2>
        <p className="mt-2 text-slate-700">
          Large repositories are sampled, not fully analyzed. The report
          states when only a subset was reviewed. A simple in-memory rate
          limit (10 requests per minute per IP) protects the API.
        </p>
      </section>
    </article>
  );
}
