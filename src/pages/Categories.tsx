import { useState } from "react";
import { useStore } from "../lib/store";
import { Card, PageHeader } from "../components/Card";
import { Button, IconButton } from "../components/Form";
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
    <div className="flex flex-col divide-y divide-line">
      {items.map((c) => (
        <div key={c.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-fg">
            <CategoryDot category={c} />
            {c.name}
          </span>
          <div className="flex items-center gap-0.5">
            <IconButton label={`Edit ${c.name}`} onClick={() => onEdit(c)}>
              <IconEdit width={15} height={15} />
            </IconButton>
            <IconButton label={`Delete ${c.name}`} tone="danger" onClick={() => onDelete(c.id)}>
              <IconTrash width={15} height={15} />
            </IconButton>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="py-4 text-sm text-fg-muted">No categories yet.</p>}
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        action={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            <IconPlus width={16} height={16} />
            Add category
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Expenses">
          <CategoryList items={expense} onEdit={handleEdit} onDelete={handleDelete} />
        </Card>
        <Card title="Income">
          <CategoryList items={income} onEdit={handleEdit} onDelete={handleDelete} />
        </Card>
      </div>

      {showForm && <CategoryForm category={editing ?? undefined} onClose={() => setShowForm(false)} />}
    </div>
  );
}
