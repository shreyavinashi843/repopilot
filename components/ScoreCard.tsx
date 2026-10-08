export default function ScoreCard({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const color =
    score >= 80
      ? "bg-green-100 text-green-900"
      : score >= 60
        ? "bg-yellow-100 text-yellow-900"
        : "bg-red-100 text-red-900";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 font-semibold ${color}`}
      aria-label={`${label}: ${score} out of 100`}
    >
      <span>{label}</span>
      <span>{score}/100</span>
    </div>
  );
}
