import { useState } from "react";
import type { Category, CategoryKind, SeriesSlot } from "../lib/types";
import { useStore } from "../lib/store";
import { makeId } from "../lib/id";
import { seriesVar } from "../lib/selectors";
import { Modal } from "../components/Modal";
import { Button, Field, Select, TextInput } from "../components/Form";

const SLOTS: SeriesSlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function CategoryForm({ category, onClose }: { category?: Category; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const isEdit = !!category;

  const usedSlots = new Set(state.categories.filter((c) => c.id !== category?.id).map((c) => c.slot));
  const firstFree = SLOTS.find((s) => !usedSlots.has(s)) ?? 1;

  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? "expense");
  const [slot, setSlot] = useState<SeriesSlot>(category?.slot ?? firstFree);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter a category name.");

    const record: Category = {
      id: category?.id ?? makeId(),
      name: name.trim(),
      kind,
      slot,
    };

    dispatch({ type: isEdit ? "UPDATE_CATEGORY" : "ADD_CATEGORY", category: record });
    onClose();
  }

  return (
    <Modal
      title={isEdit ? "Edit category" : "Add category"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" variant="primary">
            Save
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit}>
        <Field label="Category name">
          <TextInput
            placeholder="e.g. Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as CategoryKind)}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </Field>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                aria-label={`Color ${s}`}
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-surface ${
                  slot === s ? "ring-2 ring-fg" : ""
                }`}
                style={{ background: seriesVar(s) }}
              />
            ))}
          </div>
        </Field>
        {error && (
          <p role="alert" className="mb-4 text-xs text-negative">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
