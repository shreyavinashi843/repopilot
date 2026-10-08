export default function AnalysisSection({
  title,
  score,
  findings,
  recommendations,
}: {
  title: string;
  score: number;
  findings: string[];
  recommendations: string[];
}) {
  return (
    <section
      aria-labelledby={`section-${title}`}
      className="rounded-lg border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`section-${title}`} className="text-lg font-semibold">
          {title}
        </h3>
        <span
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold"
          aria-label={`${title} score ${score} out of 100`}
        >
          {score}/100
        </span>
      </div>
      <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Findings
      </h4>
      {findings.length === 0 ? (
        <p className="mt-1 text-sm text-slate-600">None reported.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {findings.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Recommendations
      </h4>
      {recommendations.length === 0 ? (
        <p className="mt-1 text-sm text-slate-600">None reported.</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
