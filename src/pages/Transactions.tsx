import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { formatCurrency, formatDate } from "../lib/format";
import { Card } from "../components/Card";
import { Button, Select, TextInput } from "../components/Form";
import { CategoryDot } from "../components/CategoryBadge";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "../components/icons";
import { TransactionForm } from "./TransactionForm";
import type { Transaction } from "../lib/types";

export function Transactions() {
  const { state, dispatch } = useStore();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return [...state.transactions]
      .filter((t) => (categoryFilter === "all" ? true : t.categoryId === categoryFilter))
      .filter((t) => (accountFilter === "all" ? true : t.accountId === accountFilter))
      .filter((t) => (query.trim() ? t.payee.toLowerCase().includes(query.trim().toLowerCase()) : true))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [state.transactions, query, categoryFilter, accountFilter]);

  function handleDelete(id: string) {
    if (confirm("Delete this transaction?")) {
      dispatch({ type: "DELETE_TRANSACTION", id });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Transactions
        </h1>
        <Button
          variant="primary"
          className="inline-flex items-center gap-1.5"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <IconPlus width={15} height={15} />
          Add transaction
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            >
              <IconSearch width={15} height={15} />
            </span>
            <TextInput
              placeholder="Search payee…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sm:w-44"
          >
            <option value="all">All categories</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="sm:w-40">
            <option value="all">All accounts</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
            No transactions match.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="text-left" style={{ color: "var(--text-muted)" }}>
                  <th className="border-b pb-2 pr-3 font-medium" style={{ borderColor: "var(--border)" }}>Date</th>
                  <th className="border-b pb-2 pr-3 font-medium" style={{ borderColor: "var(--border)" }}>Payee</th>
                  <th className="border-b pb-2 pr-3 font-medium" style={{ borderColor: "var(--border)" }}>Category</th>
                  <th className="border-b pb-2 pr-3 font-medium" style={{ borderColor: "var(--border)" }}>Account</th>
                  <th className="border-b pb-2 pr-3 text-right font-medium" style={{ borderColor: "var(--border)" }}>Amount</th>
                  <th className="border-b pb-2 font-medium" style={{ borderColor: "var(--border)" }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const cat = state.categories.find((c) => c.id === t.categoryId)!;
                  const account = state.accounts.find((a) => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="group">
                      <td
                        className="border-b py-2.5 pr-3 whitespace-nowrap"
                        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                      >
                        {formatDate(t.date)}
                      </td>
                      <td
                        className="border-b py-2.5 pr-3 font-medium"
                        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                      >
                        {t.payee}
                      </td>
                      <td className="border-b py-2.5 pr-3" style={{ borderColor: "var(--border)" }}>
                        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                          <CategoryDot category={cat} />
                          {cat.name}
                        </span>
                      </td>
                      <td
                        className="border-b py-2.5 pr-3 whitespace-nowrap"
                        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                      >
                        {account?.name}
                      </td>
                      <td
                        className="tabular-nums border-b py-2.5 pr-3 text-right font-semibold whitespace-nowrap"
                        style={{
                          borderColor: "var(--border)",
                          color: cat.kind === "income" ? "var(--status-good-text)" : "var(--text-primary)",
                        }}
                      >
                        {cat.kind === "income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="border-b py-2.5" style={{ borderColor: "var(--border)" }}>
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            aria-label="Edit"
                            onClick={() => {
                              setEditing(t);
                              setShowForm(true);
                            }}
                            className="rounded-md p-1.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <IconEdit width={15} height={15} />
                          </button>
                          <button
                            aria-label="Delete"
                            onClick={() => handleDelete(t.id)}
                            className="rounded-md p-1.5"
                            style={{ color: "var(--status-critical)" }}
                          >
                            <IconTrash width={15} height={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <TransactionForm transaction={editing ?? undefined} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
