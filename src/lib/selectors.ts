import type { AppState, Category, Transaction } from "./types";
import { monthOf } from "./format";

export function signedAmount(tx: Transaction, categories: Category[]): number {
  const cat = categories.find((c) => c.id === tx.categoryId);
  return cat?.kind === "income" ? tx.amount : -tx.amount;
}

export function accountBalance(state: AppState, accountId: string): number {
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  const delta = state.transactions
    .filter((t) => t.accountId === accountId)
    .reduce((sum, t) => sum + signedAmount(t, state.categories), 0);
  return account.startingBalance + delta;
}

export function totalBalance(state: AppState): number {
  return state.accounts.reduce((sum, a) => sum + accountBalance(state, a.id), 0);
}

export function transactionsForMonth(state: AppState, month: string): Transaction[] {
  return state.transactions.filter((t) => monthOf(t.date) === month);
}

export function monthlyIncome(state: AppState, month: string): number {
  return transactionsForMonth(state, month)
    .filter((t) => state.categories.find((c) => c.id === t.categoryId)?.kind === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function monthlyExpenses(state: AppState, month: string): number {
  return transactionsForMonth(state, month)
    .filter((t) => state.categories.find((c) => c.id === t.categoryId)?.kind === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

export interface CategorySpend {
  category: Category;
  amount: number;
}

export function spendByCategory(state: AppState, month: string): CategorySpend[] {
  const totals = new Map<string, number>();
  for (const t of transactionsForMonth(state, month)) {
    const cat = state.categories.find((c) => c.id === t.categoryId);
    if (!cat || cat.kind !== "expense") continue;
    totals.set(cat.id, (totals.get(cat.id) ?? 0) + t.amount);
  }
  return Array.from(totals.entries())
    .map(([categoryId, amount]) => ({
      category: state.categories.find((c) => c.id === categoryId)!,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export interface BudgetStatus {
  categoryId: string;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  pct: number;
  status: "good" | "warning" | "critical";
}

export function budgetStatuses(state: AppState, month: string): BudgetStatus[] {
  const spend = spendByCategory(state, month);
  return state.budgets
    .map((b) => {
      const category = state.categories.find((c) => c.id === b.categoryId);
      if (!category) return null;
      const spent = spend.find((s) => s.category.id === b.categoryId)?.amount ?? 0;
      const pct = b.monthlyLimit > 0 ? spent / b.monthlyLimit : 0;
      const status: BudgetStatus["status"] =
        pct >= 1 ? "critical" : pct >= 0.85 ? "warning" : "good";
      return {
        categoryId: b.categoryId,
        category,
        limit: b.monthlyLimit,
        spent,
        remaining: b.monthlyLimit - spent,
        pct,
        status,
      };
    })
    .filter((b): b is BudgetStatus => b !== null)
    .sort((a, b) => b.pct - a.pct);
}

export function seriesVar(slot: number): string {
  return `var(--series-${slot})`;
}
