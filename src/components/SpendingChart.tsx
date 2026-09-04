import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CategorySpend } from "../lib/selectors";
import { seriesVar } from "../lib/selectors";
import { formatCurrency } from "../lib/format";

const MAX_SLOTS = 7;

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  const top = data.slice(0, MAX_SLOTS);
  const rest = data.slice(MAX_SLOTS);
  const otherTotal = rest.reduce((sum, d) => sum + d.amount, 0);

  const rows = [
    ...top.map((d) => ({ name: d.category.name, amount: d.amount, color: seriesVar(d.category.slot) })),
    ...(otherTotal > 0 ? [{ name: "Other", amount: otherTotal, color: "var(--text-muted)" }] : []),
  ];

  if (rows.length === 0) {
    return (
      <div
        className="flex h-56 items-center justify-center text-[13px]"
        style={{ color: "var(--text-muted)" }}
      >
        No expenses recorded this month yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 34)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fill: "var(--text-muted)", fontSize: 11 }}
          axisLine={{ stroke: "var(--border-strong)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={92}
          tick={{ fill: "var(--text-secondary)", fontSize: 12.5 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          formatter={(value) => formatCurrency(Number(value))}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12.5,
            color: "var(--text-primary)",
          }}
          labelStyle={{ color: "var(--text-secondary)" }}
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={14}>
          {rows.map((row, i) => (
            <Cell key={i} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
