import { useState } from "react";
import type { Account, AccountType } from "../lib/types";
import { useStore } from "../lib/store";
import { makeId } from "../lib/id";
import { Modal } from "../components/Modal";
import { Button, Field, Select, TextInput } from "../components/Form";

const TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  cash: "Cash",
  other: "Other",
};

export function AccountForm({ account, onClose }: { account?: Account; onClose: () => void }) {
  const { dispatch } = useStore();
  const isEdit = !!account;

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "checking");
  const [startingBalance, setStartingBalance] = useState(
    account ? String(account.startingBalance) : "",
  );
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(startingBalance || "0");
    if (!name.trim()) return setError("Enter an account name.");
    if (!Number.isFinite(parsed)) return setError("Enter a valid starting balance.");

    const record: Account = {
      id: account?.id ?? makeId(),
      name: name.trim(),
      type,
      startingBalance: Math.round(parsed * 100) / 100,
    };

    dispatch({ type: isEdit ? "UPDATE_ACCOUNT" : "ADD_ACCOUNT", account: record });
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "Edit account" : "Add account"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="account-form" variant="primary">
            Save
          </Button>
        </>
      }
    >
      <form id="account-form" onSubmit={handleSubmit}>
        <Field label="Account name">
          <TextInput
            placeholder="e.g. Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Starting balance">
            <TextInput
              type="number"
              step="0.01"
              placeholder="0.00"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
            />
          </Field>
        </div>
        {error && (
          <p role="alert" className="mb-4 text-xs text-negative">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
