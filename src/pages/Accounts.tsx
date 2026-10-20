import { useState } from "react";
import { useStore } from "../lib/store";
import { accountBalance } from "../lib/selectors";
import { formatCurrency } from "../lib/format";
import { Card, PageHeader } from "../components/Card";
import { Button, IconButton } from "../components/Form";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
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

  const total = state.accounts.reduce((sum, a) => sum + accountBalance(state, a.id), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Accounts"
        description={`${state.accounts.length} accounts`}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <IconPlus width={16} height={16} />
            Add account
          </Button>
        }
      />

      <Card>
        {state.accounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">No accounts yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            {state.accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{a.name}</div>
                  <div className="text-xs text-fg-muted">{TYPE_LABELS[a.type]}</div>
                </div>
                <div className="tabular-nums text-base font-semibold text-fg">
                  {formatCurrency(accountBalance(state, a.id))}
                </div>
                <div className="flex gap-0.5">
                  <IconButton
                    label={`Edit ${a.name}`}
                    onClick={() => {
                      setEditing(a);
                      setShowForm(true);
                    }}
                  >
                    <IconEdit width={15} height={15} />
                  </IconButton>
                  <IconButton label={`Delete ${a.name}`} tone="danger" onClick={() => handleDelete(a.id)}>
                    <IconTrash width={15} height={15} />
                  </IconButton>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-4 pt-3">
              <div className="flex-1 text-sm font-medium text-fg-secondary">Total</div>
              <div className="tabular-nums text-base font-semibold text-fg">{formatCurrency(total)}</div>
              <div className="w-14" aria-hidden="true" />
            </div>
          </div>
        )}
      </Card>

      {showForm && <AccountForm account={editing ?? undefined} onClose={() => setShowForm(false)} />}
    </div>
  );
}
