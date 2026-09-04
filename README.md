# Ledger

A personal budgeting app. Track accounts, log income and expenses, set monthly
budgets per category, and see where your money goes.

## Features

- **Dashboard** — balance, monthly income/expenses/net, spending-by-category
  chart, budget progress, and recent activity.
- **Transactions** — add, edit, delete, search, and filter by category/account.
- **Budgets** — set a monthly limit per expense category and track spend
  against it, with status coloring as you approach or exceed the limit.
- **Accounts** — checking/savings/credit/cash accounts with computed balances.
- **Categories** — manage income/expense categories and their colors.
- Data is stored locally in the browser (`localStorage`) — no backend or
  account required. Light/dark theme follows your system setting, with a
  manual toggle.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL. The app ships with sample data on first
load so you can explore it immediately.

## Stack

React + TypeScript + Vite, Tailwind CSS v4, Recharts.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — lint with oxlint
