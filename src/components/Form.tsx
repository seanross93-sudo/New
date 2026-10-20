import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-xs font-medium text-fg-secondary">{label}</span>
      {children}
    </label>
  );
}

const controlClass =
  "h-9 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-muted " +
  "outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/25";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${controlClass} ${className}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={`${controlClass} ${className}`}>
      {children}
    </select>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

const buttonVariants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border-fg bg-fg text-on-ink hover:bg-fg-secondary hover:border-fg-secondary",
  secondary: "border-line-strong bg-surface text-fg hover:bg-subtle",
  danger: "border-line-strong bg-surface text-negative hover:bg-subtle",
};

export function Button({ variant = "secondary", className = "", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
    />
  );
}

export function IconButton({
  label,
  tone = "neutral",
  children,
  onClick,
}: {
  label: string;
  tone?: "neutral" | "danger";
  children: ReactNode;
  onClick: () => void;
}) {
  const toneClass =
    tone === "danger" ? "hover:bg-subtle hover:text-negative" : "hover:bg-subtle hover:text-fg";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`rounded-md p-1.5 text-fg-muted transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}
