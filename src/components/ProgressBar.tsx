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
        : "var(--status-good)";
  const width = Math.min(100, Math.max(0, pct * 100));

  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: "var(--surface-2)" }}
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}
