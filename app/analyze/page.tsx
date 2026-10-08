"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AnalysisReport from "@/components/AnalysisReport";
import LoadingState from "@/components/LoadingState";
import ErrorMessage from "@/components/ErrorMessage";
import type { AnalyzeResponse } from "@/types/analysis";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repositoryUrl: url }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Analysis failed.");
        }
        if (!cancelled) setData(json as AnalyzeResponse);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Analysis failed."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!url) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">Analyze a repository</h1>
        <p className="mt-2 text-slate-600">
          No repository URL was provided. Go back to the{" "}
          <a href="/" className="underline">
            homepage
          </a>{" "}
          and enter a public GitHub repository URL.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <a href="/" className="text-sm text-slate-600 underline">
          ← Back to home
        </a>
        <h1 className="mt-2 text-2xl font-semibold">Analysis</h1>
        <p className="break-all text-sm text-slate-600">{url}</p>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorMessage message={error} />}
      {data && <AnalysisReport data={data} />}
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AnalyzeContent />
    </Suspense>
  );
}
