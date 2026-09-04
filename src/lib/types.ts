export type SeriesSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AccountType = "checking" | "savings" | "credit" | "cash" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  startingBalance: number;
}

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  slot: SeriesSlot;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  accountId: string;
  categoryId: string;
  payee: string;
  amount: number; // always positive; sign comes from category kind
  notes?: string;
}

export interface Budget {
  categoryId: string;
  monthlyLimit: number;
}

export interface AppState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}
