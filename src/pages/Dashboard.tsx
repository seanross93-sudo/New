import { useStore } from "../lib/store";
import {
  budgetStatuses,
  monthlyExpenses,
  monthlyIncome,
  spendByCategory,
  totalBalance,
} from "../lib/selectors";
import { currentMonth, formatCurrency, formatDate, formatSignedCurrency, monthLabel } from "../lib/format";
import { Card, PageHeader, TextLink } from "../components/Card";
import { StatTile } from "../components/StatTile";
import { SpendingChart } from "../components/SpendingChart";
import { ProgressBar } from "../components/ProgressBar";
import { CategoryDot } from "../components/CategoryBadge";
import type { Page } from "../App";

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { state } = useStore();
  const month = currentMonth();

  const balance = totalBalance(state);
  const income = monthlyIncome(state, month);
  const expenses = monthlyExpenses(state, month);
  const net = income - expenses;
  const spend = spendByCategory(state, month);
  const budgets = budgetStatuses(state, month).slice(0, 5);

  const recent = [...state.transactions]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" description={monthLabel(month)} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Total balance" value={formatCurrency(balance)} sublabel="All accounts" />
        <StatTile
          label="Income"
          value={formatCurrency(income)}
sublabel="This month"
        />
        <StatTile
          label="Expenses"
          value={formatCurrency(expenses)}
sublabel="This month"
        />
        <StatTile
          label="Net"
          value={formatSignedCurrency(net)}
          tone={net >= 0 ? "good" : "critical"}
          sublabel="Income minus expenses"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card title="Spending by category" className="lg:col-span-3">
          <SpendingChart data={spend} />
        </Card>

        <Card
          title="Budgets"
          className="lg:col-span-2"
          action={
            <TextLink onClick={() => onNavigate("budgets")}>View all</TextLink>
          }
        >
          {budgets.length === 0 ? (
            <p className="text-sm text-fg-muted">No budgets set.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {budgets.map((b) => (
                <div key={b.categoryId}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium text-fg">
                      <CategoryDot category={b.category} />
                      {b.category.name}
                    </span>
                    <span className="tabular-nums text-xs text-fg-secondary">
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>
                  <ProgressBar pct={b.pct} status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Recent transactions"
        action={
          <TextLink onClick={() => onNavigate("transactions")}>View all</TextLink>
        }
      >
        <div className="flex flex-col divide-y divide-line">
          {recent.map((t) => {
            const cat = state.categories.find((c) => c.id === t.categoryId)!;
            const account = state.accounts.find((a) => a.id === t.accountId);
            return (
              <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-fg">
                    {t.payee}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-muted">
                    <CategoryDot category={cat} />
                    {cat.name} · {account?.name} · {formatDate(t.date)}
                  </div>
                </div>
                <div
                  className={`tabular-nums shrink-0 pl-3 text-sm font-medium ${
                    cat.kind === "income" ? "text-positive" : "text-fg"
                  }`}
                >
                  {cat.kind === "income" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
