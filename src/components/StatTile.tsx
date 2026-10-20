import type { ReactNode } from "react";

export function StatTile({
  label,
  value,
  sublabel,
  tone = "primary",
}: {
  label: string;
  value: string;
  sublabel?: ReactNode;
  tone?: "primary" | "good" | "critical";
}) {
  const toneClass = tone === "good" ? "text-positive" : tone === "critical" ? "text-negative" : "text-fg";

  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <div className="text-xs font-medium text-fg-muted">{label}</div>
      <div className={`tabular-nums mt-2 text-2xl font-semibold leading-none tracking-tight ${toneClass}`}>
        {value}
      </div>
      {sublabel && <div className="mt-2 text-xs text-fg-secondary">{sublabel}</div>}
    </div>
  );
}
