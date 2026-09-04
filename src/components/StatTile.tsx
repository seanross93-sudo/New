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
  const color =
    tone === "good"
      ? "var(--status-good-text)"
      : tone === "critical"
        ? "var(--status-critical)"
        : "var(--text-primary)";

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="text-[12.5px] font-medium" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="tabular-nums mt-2 text-[26px] font-semibold leading-none" style={{ color }}>
        {value}
      </div>
      {sublabel && (
        <div className="mt-2 text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
