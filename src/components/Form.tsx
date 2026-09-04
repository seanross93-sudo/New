import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[12.5px] font-medium" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const controlStyle = {
  borderColor: "var(--border-strong)",
  background: "var(--surface-1)",
  color: "var(--text-primary)",
};

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ ...controlStyle, ["--tw-ring-color" as string]: "var(--series-1)" }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded-lg border px-3 py-2 text-[13.5px] outline-none focus:ring-2 ${className}`}
      style={{ ...controlStyle, ["--tw-ring-color" as string]: "var(--series-1)" }}
    >
      {children}
    </select>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export function Button({ variant = "secondary", className = "", ...rest }: ButtonProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--series-1)", color: "white", borderColor: "var(--series-1)" },
    secondary: { background: "transparent", color: "var(--text-primary)", borderColor: "var(--border-strong)" },
    danger: { background: "transparent", color: "var(--status-critical)", borderColor: "var(--border-strong)" },
  };
  return (
    <button
      {...rest}
      className={`rounded-lg border px-3.5 py-2 text-[13.5px] font-medium transition-opacity disabled:opacity-50 ${className}`}
      style={styles[variant]}
    />
  );
}
