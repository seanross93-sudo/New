import { useStore } from "../lib/store";
import {
  budgetStatuses,
  monthlyExpenses,
  monthlyIncome,
  spendByCategory,
  totalBalance,
} from "../lib/selectors";
import { currentMonth, formatCurrency, formatDate, formatSignedCurrency, monthLabel } from "../lib/format";
import { Card } from "../components/Card";
import { StatTile } from "../components/StatTile";
import { SpendingChart } from "../components/SpendingChart";
import { ProgressBar } from "../components/ProgressBar";
import { CategoryDot } from "../components/CategoryBadge";
import { IconArrowDown, IconArrowUp } from "../components/icons";
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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-muted)" }}>
          {monthLabel(month)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total balance" value={formatCurrency(balance)} />
        <StatTile
          label="Income"
          value={formatCurrency(income)}
          tone="good"
          sublabel={
            <span className="inline-flex items-center gap-1">
              <IconArrowUp width={13} height={13} /> this month
            </span>
          }
        />
        <StatTile
          label="Expenses"
          value={formatCurrency(expenses)}
          tone="critical"
          sublabel={
            <span className="inline-flex items-center gap-1">
              <IconArrowDown width={13} height={13} /> this month
            </span>
          }
        />
        <StatTile
          label="Net"
          value={formatSignedCurrency(net)}
          tone={net >= 0 ? "good" : "critical"}
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
            <button
              onClick={() => onNavigate("budgets")}
              className="text-[12.5px] font-medium"
              style={{ color: "var(--series-1)" }}
            >
              View all
            </button>
          }
        >
          {budgets.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              No budgets set yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {budgets.map((b) => (
                <div key={b.categoryId}>
                  <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                    <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--text-primary)" }}>
                      <CategoryDot category={b.category} />
                      {b.category.name}
                    </span>
                    <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
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
          <button
            onClick={() => onNavigate("transactions")}
            className="text-[12.5px] font-medium"
            style={{ color: "var(--series-1)" }}
          >
            View all
          </button>
        }
      >
        <div className="flex flex-col">
          {recent.map((t) => {
            const cat = state.categories.find((c) => c.id === t.categoryId)!;
            const account = state.accounts.find((a) => a.id === t.accountId);
            return (
              <div
                key={t.id}
                className="flex items-center justify-between border-b py-2.5 last:border-0"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {t.payee}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                    <CategoryDot category={cat} />
                    {cat.name} · {account?.name} · {formatDate(t.date)}
                  </div>
                </div>
                <div
                  className="tabular-nums shrink-0 pl-3 text-[13.5px] font-semibold"
                  style={{ color: cat.kind === "income" ? "var(--status-good-text)" : "var(--text-primary)" }}
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
