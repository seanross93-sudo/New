import { useState } from "react";
import { useStore } from "../lib/store";
import { budgetStatuses, spendByCategory } from "../lib/selectors";
import { currentMonth, formatCurrency, monthLabel } from "../lib/format";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { CategoryDot } from "../components/CategoryBadge";
import { TextInput } from "../components/Form";

export function Budgets() {
  const { state, dispatch } = useStore();
  const month = currentMonth();
  const statuses = budgetStatuses(state, month);
  const spend = spendByCategory(state, month);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const expenseCategories = state.categories.filter((c) => c.kind === "expense");

  function limitFor(categoryId: string): number | null {
    return state.budgets.find((b) => b.categoryId === categoryId)?.monthlyLimit ?? null;
  }

  function commit(categoryId: string, value: string) {
    const amount = parseFloat(value);
    if (!Number.isFinite(amount) || amount < 0) return;
    dispatch({ type: "SET_BUDGET", budget: { categoryId, monthlyLimit: Math.round(amount * 100) / 100 } });
    setDrafts((d) => {
      const next = { ...d };
      delete next[categoryId];
      return next;
    });
  }

  const totalLimit = statuses.reduce((s, b) => s + b.limit, 0);
  const totalSpent = statuses.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Budgets
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {monthLabel(month)} · {formatCurrency(totalSpent)} of {formatCurrency(totalLimit)} budgeted spent
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-5">
          {expenseCategories.map((c) => {
            const status = statuses.find((s) => s.categoryId === c.id);
            const limit = limitFor(c.id);
            const spent = spend.find((s) => s.category.id === c.id)?.amount ?? 0;
            const draft = drafts[c.id];

            return (
              <div key={c.id}>
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 text-[13.5px] font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <CategoryDot category={c} />
                    {c.name}
                  </span>

                  <div className="flex items-center gap-3">
                    {status && (
                      <span
                        className="tabular-nums text-[12.5px]"
                        style={{
                          color:
                            status.status === "critical"
                              ? "var(--status-critical)"
                              : status.status === "warning"
                                ? "var(--status-warning)"
                                : "var(--text-secondary)",
                        }}
                      >
                        {formatCurrency(spent)}
                        {status.remaining >= 0
                          ? ` · ${formatCurrency(status.remaining)} left`
                          : ` · ${formatCurrency(-status.remaining)} over`}
                      </span>
                    )}
                    <div className="flex w-32 items-center gap-1.5">
                      <span className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>$</span>
                      <TextInput
                        type="number"
                        min="0"
                        step="1"
                        placeholder={limit === null ? "No limit" : undefined}
                        value={draft ?? limit ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                        onBlur={() => {
                          if (draft !== undefined && draft !== String(limit ?? "")) commit(c.id, draft);
                        }}
                      />
                    </div>
                  </div>
                </div>
                {limit !== null && limit > 0 && (
                  <ProgressBar pct={spent / limit} status={status?.status ?? "good"} />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
