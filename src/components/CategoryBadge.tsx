import type { Category } from "../lib/types";
import { seriesVar } from "../lib/selectors";

export function CategoryDot({ category }: { category: Category }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: seriesVar(category.slot) }}
    />
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs font-medium text-fg">
      <CategoryDot category={category} />
      {category.name}
    </span>
  );
}
