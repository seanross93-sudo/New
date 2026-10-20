export function ProgressBar({
  pct,
  status = "good",
}: {
  pct: number;
  status?: "good" | "warning" | "critical";
}) {
  const color =
    status === "critical"
      ? "var(--status-critical)"
      : status === "warning"
        ? "var(--status-warning)"
        : "var(--text-secondary)";
  const width = Math.min(100, Math.max(0, pct * 100));

  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-subtle"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}
