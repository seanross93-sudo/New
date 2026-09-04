import { useState } from "react";
import type { Transaction } from "../lib/types";
import { useStore } from "../lib/store";
import { makeId } from "../lib/id";
import { todayIso } from "../lib/format";
import { Modal } from "../components/Modal";
import { Button, Field, Select, TextInput } from "../components/Form";

export function TransactionForm({
  transaction,
  onClose,
}: {
  transaction?: Transaction;
  onClose: () => void;
}) {
  const { state, dispatch } = useStore();
  const isEdit = !!transaction;

  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [accountId, setAccountId] = useState(transaction?.accountId ?? state.accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? state.categories[0]?.id ?? "");
  const [payee, setPayee] = useState(transaction?.payee ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!payee.trim()) return setError("Enter a payee or description.");
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError("Enter a valid amount.");
    if (!accountId || !categoryId) return setError("Choose an account and category.");

    const record: Transaction = {
      id: transaction?.id ?? makeId(),
      date,
      accountId,
      categoryId,
      payee: payee.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      notes: notes.trim() || undefined,
    };

    dispatch({ type: isEdit ? "UPDATE_TRANSACTION" : "ADD_TRANSACTION", transaction: record });
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "Edit transaction" : "Add transaction"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="tx-form" variant="primary">
            Save
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Date">
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Amount">
            <TextInput
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Payee / description">
          <TextInput
            placeholder="e.g. Trader Joe's"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-x-3">
          <Field label="Account">
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Category">
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <optgroup label="Expense">
                {state.categories.filter((c) => c.kind === "expense").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Income">
                {state.categories.filter((c) => c.kind === "income").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
        </div>

        <Field label="Notes (optional)">
          <TextInput placeholder="Add a note" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {error && (
          <p className="text-[12.5px]" style={{ color: "var(--status-critical)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
