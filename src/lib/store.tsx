import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { Account, AppState, Budget, Category, Transaction } from "./types";
import { seedState } from "./seed";

const STORAGE_KEY = "ledger.state.v1";

type Action =
  | { type: "ADD_ACCOUNT"; account: Account }
  | { type: "UPDATE_ACCOUNT"; account: Account }
  | { type: "DELETE_ACCOUNT"; id: string }
  | { type: "ADD_CATEGORY"; category: Category }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "ADD_TRANSACTION"; transaction: Transaction }
  | { type: "UPDATE_TRANSACTION"; transaction: Transaction }
  | { type: "DELETE_TRANSACTION"; id: string }
  | { type: "SET_BUDGET"; budget: Budget }
  | { type: "RESET_DEMO" };

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    // fall through to seed
  }
  return seedState();
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_ACCOUNT":
      return { ...state, accounts: [...state.accounts, action.account] };
    case "UPDATE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((a) => (a.id === action.account.id ? action.account : a)),
      };
    case "DELETE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.id),
        transactions: state.transactions.filter((t) => t.accountId !== action.id),
      };
    case "ADD_CATEGORY":
      return { ...state, categories: [...state.categories, action.category] };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) => (c.id === action.category.id ? action.category : c)),
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.id),
        transactions: state.transactions.filter((t) => t.categoryId !== action.id),
        budgets: state.budgets.filter((b) => b.categoryId !== action.id),
      };
    case "ADD_TRANSACTION":
      return { ...state, transactions: [action.transaction, ...state.transactions] };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.transaction.id ? action.transaction : t,
        ),
      };
    case "DELETE_TRANSACTION":
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case "SET_BUDGET": {
      const exists = state.budgets.some((b) => b.categoryId === action.budget.categoryId);
      return {
        ...state,
        budgets: exists
          ? state.budgets.map((b) =>
              b.categoryId === action.budget.categoryId ? action.budget : b,
            )
          : [...state.budgets, action.budget],
      };
    }
    case "RESET_DEMO":
      return seedState();
    default:
      return state;
  }
}

interface StoreValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
