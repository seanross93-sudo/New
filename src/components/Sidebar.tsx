import type { Page } from "../App";
import { IconDashboard, IconList, IconTarget, IconWallet, IconTag, IconMoon, IconSun, LogoMark } from "./icons";
import { useTheme } from "../lib/theme";

interface NavItem {
  page: Page;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard", label: "Overview", icon: IconDashboard },
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
    <aside className="flex shrink-0 flex-col border-b border-line bg-surface md:h-screen md:w-56 md:border-r md:border-b-0 md:sticky md:top-0">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4 text-fg">
        <LogoMark width={20} height={20} />
        <span className="text-base font-semibold tracking-tight">Ledger</span>
      </div>

      <nav className="flex flex-1 gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active = item.page === page;
          const Icon = item.icon;
          return (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-subtle text-fg" : "text-fg-secondary hover:bg-subtle hover:text-fg"
              }`}
            >
              <Icon className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden border-t border-line px-3 py-3 md:block">
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-fg-secondary transition-colors hover:bg-subtle hover:text-fg"
        >
          {isDark ? <IconSun /> : <IconMoon />}
          {isDark ? "Light theme" : "Dark theme"}
        </button>
      </div>
    </aside>
  );
}
