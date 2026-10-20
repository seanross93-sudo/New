import { useState } from "react";
import { useStore } from "../lib/store";
import { budgetStatuses, spendByCategory } from "../lib/selectors";
import { currentMonth, formatCurrency, monthLabel } from "../lib/format";
import { Card, PageHeader } from "../components/Card";
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Budgets"
        description={`${monthLabel(month)} \u00b7 ${formatCurrency(totalSpent)} spent of ${formatCurrency(totalLimit)} budgeted`}
      />

      <Card>
        <div className="flex flex-col divide-y divide-line">
          {expenseCategories.map((c) => {
            const status = statuses.find((s) => s.categoryId === c.id);
            const limit = limitFor(c.id);
            const spent = spend.find((s) => s.category.id === c.id)?.amount ?? 0;
            const draft = drafts[c.id];
            const statusClass =
              status?.status === "critical"
                ? "text-negative"
                : status?.status === "warning"
                  ? "text-caution"
                  : "text-fg-secondary";

            return (
              <div key={c.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
                    <CategoryDot category={c} />
                    {c.name}
                  </span>

                  <div className="flex items-center gap-4">
                    {status && (
                      <span className={`tabular-nums text-xs ${statusClass}`}>
                        {formatCurrency(spent)}
                        {status.remaining >= 0
                          ? ` spent \u00b7 ${formatCurrency(status.remaining)} left`
                          : ` spent \u00b7 ${formatCurrency(-status.remaining)} over`}
                      </span>
                    )}
                    <div className="relative w-32">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-fg-muted">
                        $
                      </span>
                      <TextInput
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Monthly limit for ${c.name}`}
                        placeholder={limit === null ? "No limit" : undefined}
                        value={draft ?? limit ?? ""}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                        }}
                        onBlur={() => {
                          if (draft !== undefined && draft !== String(limit ?? "")) commit(c.id, draft);
                        }}
                        className="tabular-nums pl-6 text-right"
                      />
                    </div>
                  </div>
                </div>
                {limit !== null && limit > 0 && (
                  <div className="mt-3">
                    <ProgressBar pct={spent / limit} status={status?.status ?? "good"} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
