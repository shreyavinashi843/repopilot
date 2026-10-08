const STAGES = [
  "Fetching repository",
  "Reading repository structure",
  "Selecting relevant files",
  "Preparing analysis",
  "Generating report",
];

export default function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-slate-200 bg-white p-6"
    >
      <p className="font-medium">Analyzing repository…</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {STAGES.map((stage) => (
          <li key={stage} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-3 w-3 animate-pulse rounded-full bg-blue-600"
            />
            {stage}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        This may take up to a minute. Progress reflects request state, not a
        percentage.
      </p>
    </div>
  );
}
