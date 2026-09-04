import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Budgets } from "./pages/Budgets";
import { Accounts } from "./pages/Accounts";
import { Categories } from "./pages/Categories";

export type Page = "dashboard" | "transactions" | "budgets" | "accounts" | "categories";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={{ background: "var(--surface-0)" }}>
      <Sidebar page={page} onNavigate={setPage} />
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-5xl">
          {page === "dashboard" && <Dashboard onNavigate={setPage} />}
          {page === "transactions" && <Transactions />}
          {page === "budgets" && <Budgets />}
          {page === "accounts" && <Accounts />}
          {page === "categories" && <Categories />}
        </div>
      </main>
    </div>
  );
}
