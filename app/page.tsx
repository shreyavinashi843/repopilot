import RepositoryForm from "@/components/RepositoryForm";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section aria-labelledby="hero-heading" className="text-center">
        <h1 id="hero-heading" className="text-4xl font-bold tracking-tight">
          RepoPilot
        </h1>
        <p className="mt-3 text-xl text-slate-700">
          Understand any GitHub repository with AI.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">
          RepoPilot analyzes public GitHub repositories and generates practical
          recommendations for code quality, testing, documentation, security,
          and maintainability.
        </p>
        <div className="mx-auto mt-8 max-w-xl">
          <RepositoryForm />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Try: https://github.com/vercel/next.js
        </p>
      </section>

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-2xl font-semibold">
          How it works
        </h2>
        <ol className="mt-4 grid gap-4 md:grid-cols-3">
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong>1. Enter a GitHub repository</strong>
            <p className="mt-2 text-sm text-slate-600">
              Paste a public repository URL. Private repositories are not
              supported.
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong>2. RepoPilot analyzes relevant files</strong>
            <p className="mt-2 text-sm text-slate-600">
              Metadata, file tree, and a bounded subset of source and docs
              files are retrieved.
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <strong>3. AI generates an actionable report</strong>
            <p className="mt-2 text-sm text-slate-600">
              A structured report with scores, findings, and priority actions
              you can export as Markdown.
            </p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="analysis-areas">
        <h2 id="analysis-areas" className="text-2xl font-semibold">
          Analysis areas
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[
            "Code Quality",
            "Architecture",
            "Security",
            "Testing",
            "Documentation",
            "Maintainability",
          ].map((area) => (
            <li
              key={area}
              className="rounded-lg border border-slate-200 bg-white p-4 font-medium"
            >
              {area}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-labelledby="open-source"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 id="open-source" className="text-2xl font-semibold">
          Open source
        </h2>
        <p className="mt-2 text-slate-600">
          RepoPilot is an open-source project. Contributions are welcome —
          see the documentation and contributing guide to get started.
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
          >
            View on GitHub
          </a>
          <a
            href="/docs"
            className="rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-100"
          >
            Read the docs
          </a>
        </div>
      </section>
    </div>
  );
}
