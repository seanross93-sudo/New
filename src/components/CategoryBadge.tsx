import type { Category } from "../lib/types";
import { seriesVar } from "../lib/selectors";

export function CategoryDot({ category }: { category: Category }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: seriesVar(category.slot) }}
    />
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-medium"
      style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      <CategoryDot category={category} />
      {category.name}
    </span>
  );
}
