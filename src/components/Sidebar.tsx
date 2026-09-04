import type { Page } from "../App";
import { IconDashboard, IconList, IconTarget, IconWallet, IconTag, IconMoon, IconSun } from "./icons";
import { useTheme } from "../lib/theme";

interface NavItem {
  page: Page;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard", label: "Dashboard", icon: IconDashboard },
  { page: "transactions", label: "Transactions", icon: IconList },
  { page: "budgets", label: "Budgets", icon: IconTarget },
  { page: "accounts", label: "Accounts", icon: IconWallet },
  { page: "categories", label: "Categories", icon: IconTag },
];

export function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return (
    <aside
      className="flex md:h-screen md:flex-col md:w-56 shrink-0 border-b md:border-b-0 md:border-r"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--series-1)" }}
        >
          L
        </div>
        <span className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Ledger
        </span>
      </div>

      <nav className="flex flex-1 gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active = item.page === page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors"
              style={{
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <Icon className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden md:block px-3 pb-5">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          {isDark ? <IconSun /> : <IconMoon />}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}
