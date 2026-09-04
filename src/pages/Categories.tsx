import { useState } from "react";
import { useStore } from "../lib/store";
import { Card } from "../components/Card";
import { Button } from "../components/Form";
import { CategoryDot } from "../components/CategoryBadge";
import { IconEdit, IconPlus, IconTrash } from "../components/icons";
import { CategoryForm } from "./CategoryForm";
import type { Category } from "../lib/types";

function CategoryList({
  items,
  onEdit,
  onDelete,
}: {
  items: Category[];
  onEdit: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {items.map((c) => (
        <div
          key={c.id}
          className="group flex items-center justify-between border-b py-2.5 last:border-0"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="inline-flex items-center gap-2 text-[13.5px] font-medium" style={{ color: "var(--text-primary)" }}>
            <CategoryDot category={c} />
            {c.name}
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              aria-label="Edit"
              onClick={() => onEdit(c)}
              className="rounded-md p-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              <IconEdit width={15} height={15} />
            </button>
            <button
              aria-label="Delete"
              onClick={() => onDelete(c.id)}
              className="rounded-md p-1.5"
              style={{ color: "var(--status-critical)" }}
            >
              <IconTrash width={15} height={15} />
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-4 text-[13px]" style={{ color: "var(--text-muted)" }}>
          No categories yet.
        </p>
      )}
    </div>
  );
}

export function Categories() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleDelete(id: string) {
    if (confirm("Delete this category and its transactions/budget?")) {
      dispatch({ type: "DELETE_CATEGORY", id });
    }
  }

  function handleEdit(c: Category) {
    setEditing(c);
    setShowForm(true);
  }

  const income = state.categories.filter((c) => c.kind === "income");
  const expense = state.categories.filter((c) => c.kind === "expense");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Categories
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
          Add category
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Expense categories">
          <CategoryList items={expense} onEdit={handleEdit} onDelete={handleDelete} />
        </Card>
        <Card title="Income categories">
          <CategoryList items={income} onEdit={handleEdit} onDelete={handleDelete} />
        </Card>
      </div>

      {showForm && <CategoryForm category={editing ?? undefined} onClose={() => setShowForm(false)} />}
    </div>
  );
}
