import { useState } from "react";
import { useStore } from "../lib/store";
import { accountBalance } from "../lib/selectors";
import { formatCurrency } from "../lib/format";
import { Card } from "../components/Card";
import { Button } from "../components/Form";
import { IconEdit, IconPlus, IconTrash, IconWallet } from "../components/icons";
import { AccountForm } from "./AccountForm";
import type { Account } from "../lib/types";

const TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  cash: "Cash",
  other: "Other",
};

export function Accounts() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Account | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleDelete(id: string) {
    if (confirm("Delete this account and its transactions?")) {
      dispatch({ type: "DELETE_ACCOUNT", id });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Accounts
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
          Add account
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {state.accounts.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
              >
                <IconWallet width={16} height={16} />
              </div>
              <div className="flex gap-1">
                <button
                  aria-label="Edit"
                  onClick={() => {
                    setEditing(a);
                    setShowForm(true);
                  }}
                  className="rounded-md p-1.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  <IconEdit width={15} height={15} />
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => handleDelete(a.id)}
                  className="rounded-md p-1.5"
                  style={{ color: "var(--status-critical)" }}
                >
                  <IconTrash width={15} height={15} />
                </button>
              </div>
            </div>
            <div className="mt-4 text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>
              {a.name}
            </div>
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              {TYPE_LABELS[a.type]}
            </div>
            <div className="tabular-nums mt-3 text-[22px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(accountBalance(state, a.id))}
            </div>
          </Card>
        ))}
      </div>

      {showForm && <AccountForm account={editing ?? undefined} onClose={() => setShowForm(false)} />}
    </div>
  );
}
