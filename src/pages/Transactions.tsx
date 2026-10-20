import { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { formatCurrency, formatDate } from "../lib/format";
import { Card, PageHeader } from "../components/Card";
import { Button, IconButton, Select, TextInput } from "../components/Form";
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

  const th = "border-b border-line pb-2 pr-4 text-xs font-medium text-fg-muted";
  const td = "py-3 pr-4";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transactions"
        description={`${filtered.length} of ${state.transactions.length} transactions`}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <IconPlus width={16} height={16} />
            Add transaction
          </Button>
        }
      />

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted">
              <IconSearch width={15} height={15} />
            </span>
            <TextInput
              type="search"
              aria-label="Search by payee"
              placeholder="Search by payee"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            aria-label="Filter by category"
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
          <Select
            aria-label="Filter by account"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="all">All accounts</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>

        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">No transactions match these filters.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left">
                  <th className={th}>Date</th>
                  <th className={th}>Payee</th>
                  <th className={th}>Category</th>
                  <th className={th}>Account</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={`${th} pr-0`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((t) => {
                  const cat = state.categories.find((c) => c.id === t.categoryId)!;
                  const account = state.accounts.find((a) => a.id === t.accountId);
                  return (
                    <tr key={t.id} className="transition-colors hover:bg-subtle/60">
                      <td className={`${td} whitespace-nowrap text-fg-secondary`}>{formatDate(t.date)}</td>
                      <td className={`${td} font-medium text-fg`}>{t.payee}</td>
                      <td className={td}>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap text-fg-secondary">
                          <CategoryDot category={cat} />
                          {cat.name}
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap text-fg-secondary`}>{account?.name}</td>
                      <td
                        className={`${td} tabular-nums text-right font-medium whitespace-nowrap ${
                          cat.kind === "income" ? "text-positive" : "text-fg"
                        }`}
                      >
                        {cat.kind === "income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <IconButton
                            label="Edit transaction"
                            onClick={() => {
                              setEditing(t);
                              setShowForm(true);
                            }}
                          >
                            <IconEdit width={15} height={15} />
                          </IconButton>
                          <IconButton label="Delete transaction" tone="danger" onClick={() => handleDelete(t.id)}>
                            <IconTrash width={15} height={15} />
                          </IconButton>
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
