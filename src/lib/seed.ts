import type { AppState } from "./types";
import { todayIso } from "./format";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function seedState(): AppState {
  const accounts: AppState["accounts"] = [
    { id: "acc-checking", name: "Checking", type: "checking", startingBalance: 2400 },
    { id: "acc-savings", name: "Savings", type: "savings", startingBalance: 8500 },
    { id: "acc-credit", name: "Credit Card", type: "credit", startingBalance: 0 },
  ];

  const categories: AppState["categories"] = [
    { id: "cat-salary", name: "Salary", kind: "income", slot: 1 },
    { id: "cat-freelance", name: "Freelance", kind: "income", slot: 3 },
    { id: "cat-groceries", name: "Groceries", kind: "expense", slot: 2 },
    { id: "cat-dining", name: "Dining Out", kind: "expense", slot: 4 },
    { id: "cat-rent", name: "Rent", kind: "expense", slot: 7 },
    { id: "cat-transport", name: "Transport", kind: "expense", slot: 1 },
    { id: "cat-utilities", name: "Utilities", kind: "expense", slot: 6 },
    { id: "cat-entertainment", name: "Entertainment", kind: "expense", slot: 5 },
    { id: "cat-shopping", name: "Shopping", kind: "expense", slot: 8 },
    { id: "cat-health", name: "Health", kind: "expense", slot: 3 },
  ];

  const budgets: AppState["budgets"] = [
    { categoryId: "cat-groceries", monthlyLimit: 500 },
    { categoryId: "cat-dining", monthlyLimit: 200 },
    { categoryId: "cat-rent", monthlyLimit: 1500 },
    { categoryId: "cat-transport", monthlyLimit: 150 },
    { categoryId: "cat-utilities", monthlyLimit: 250 },
    { categoryId: "cat-entertainment", monthlyLimit: 100 },
    { categoryId: "cat-shopping", monthlyLimit: 200 },
    { categoryId: "cat-health", monthlyLimit: 100 },
  ];

  const transactions: AppState["transactions"] = [
    { id: "t1", date: daysAgo(1), accountId: "acc-checking", categoryId: "cat-groceries", payee: "Trader Joe's", amount: 84.32 },
    { id: "t2", date: daysAgo(2), accountId: "acc-credit", categoryId: "cat-dining", payee: "Ramen House", amount: 28.5 },
    { id: "t3", date: daysAgo(3), accountId: "acc-checking", categoryId: "cat-transport", payee: "Metro Transit", amount: 45 },
    { id: "t4", date: daysAgo(4), accountId: "acc-checking", categoryId: "cat-rent", payee: "Skyline Apartments", amount: 1500 },
    { id: "t5", date: daysAgo(5), accountId: "acc-credit", categoryId: "cat-entertainment", payee: "Movie Theater", amount: 32 },
    { id: "t6", date: daysAgo(6), accountId: "acc-checking", categoryId: "cat-utilities", payee: "City Power & Water", amount: 142.18 },
    { id: "t7", date: daysAgo(1), accountId: "acc-checking", categoryId: "cat-salary", payee: "Acme Corp Payroll", amount: 3200 },
    { id: "t8", date: daysAgo(8), accountId: "acc-credit", categoryId: "cat-shopping", payee: "Target", amount: 96.4 },
    { id: "t9", date: daysAgo(9), accountId: "acc-checking", categoryId: "cat-groceries", payee: "Whole Foods", amount: 61.2 },
    { id: "t10", date: daysAgo(10), accountId: "acc-checking", categoryId: "cat-health", payee: "Downtown Pharmacy", amount: 24.75 },
    { id: "t11", date: daysAgo(12), accountId: "acc-checking", categoryId: "cat-freelance", payee: "Design Client", amount: 650 },
    { id: "t12", date: daysAgo(13), accountId: "acc-credit", categoryId: "cat-dining", payee: "Corner Cafe", amount: 14.6 },
    { id: "t13", date: daysAgo(15), accountId: "acc-checking", categoryId: "cat-transport", payee: "Shell Gas Station", amount: 52.3 },
    { id: "t14", date: daysAgo(18), accountId: "acc-credit", categoryId: "cat-entertainment", payee: "Streaming Service", amount: 15.99 },
    { id: "t15", date: daysAgo(20), accountId: "acc-checking", categoryId: "cat-groceries", payee: "Trader Joe's", amount: 73.1 },
    { id: "t16", date: todayIso(), accountId: "acc-credit", categoryId: "cat-shopping", payee: "Amazon", amount: 41.99 },
  ];

  return { accounts, categories, transactions, budgets };
}
