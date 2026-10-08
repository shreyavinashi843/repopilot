"use client";

import AnalysisSection from "./AnalysisSection";
import ScoreCard from "./ScoreCard";
import { analysisToMarkdown } from "@/lib/markdown";
import { CATEGORY_LABELS, type AnalyzeResponse } from "@/types/analysis";

export default function AnalysisReport({ data }: { data: AnalyzeResponse }) {
  function handleExport() {
    const markdown = analysisToMarkdown(
      data.repository,
      data.analysis,
      data.metadata.filesAnalyzed,
      data.metadata.truncated
    );
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.repository.owner}-${data.repository.name}-analysis.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="report-heading"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h2 id="report-heading" className="text-xl font-semibold">
          <a
            href={data.repository.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
          >
            {data.repository.owner}/{data.repository.name}
          </a>
        </h2>
        {data.repository.description && (
          <p className="mt-2 text-slate-600">{data.repository.description}</p>
        )}
        <div className="mt-4">
          <ScoreCard label="Overall" score={data.analysis.overallScore} />
        </div>
        <p className="mt-4 text-slate-700">{data.analysis.summary}</p>
        <p className="mt-2 text-sm text-slate-500">
          {data.metadata.filesAnalyzed} files analyzed
          {data.metadata.truncated
            ? " (representative subset — repository exceeded the analysis limit)"
            : ""}
          . Default branch: {data.repository.defaultBranch}.
        </p>
        <button
          type="button"
          onClick={handleExport}
          className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Export Markdown
        </button>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {(
          Object.entries(CATEGORY_LABELS) as Array<
            [keyof typeof CATEGORY_LABELS, string]
          >
        ).map(([key, label]) => (
          <AnalysisSection
            key={key}
            title={label}
            score={data.analysis.categories[key].score}
            findings={data.analysis.categories[key].findings}
            recommendations={data.analysis.categories[key].recommendations}
          />
        ))}
      </div>

      <section
        aria-labelledby="priority-actions"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h3 id="priority-actions" className="text-lg font-semibold">
          Priority Actions
        </h3>
        {data.analysis.priorityActions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">None reported.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {data.analysis.priorityActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ol>
        )}
      </section>

      <section
        aria-labelledby="limitations"
        className="rounded-lg border border-slate-200 bg-white p-6"
      >
        <h3 id="limitations" className="text-lg font-semibold">
          Analysis Limitations
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {data.metadata.truncated && (
            <li>
              Only {data.metadata.filesAnalyzed} files were selected because
              the repository exceeded the configured analysis limit.
            </li>
          )}
          {data.analysis.limitations.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
