export interface Account {
  id: string;
  name: string;
  offbudget: boolean;
  closed: boolean;
  balance_current: number | null;
}

export interface Category {
  id: string;
  name: string;
  is_income: boolean;
  hidden: boolean;
  group_id: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  is_income: boolean;
  hidden: boolean;
}

export interface Payee {
  id: string;
  name: string;
  transfer_acct?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  payee?: string;
  payee_name?: string;
  notes?: string;
  category?: string;
  account: string;
  cleared?: boolean;
  reconciled?: boolean;
  transfer_id?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  is_income: boolean;
  hidden: boolean;
  group_id: string;
  budgeted: number;
  spent: number;
  balance: number;
  carryover: boolean;
}

export interface BudgetCategoryGroup {
  id: string;
  name: string;
  is_income: boolean;
  hidden: boolean;
  categories: BudgetCategory[];
  budgeted: number;
  spent: number;
  balance: number;
}

export interface BudgetMonth {
  month: string;
  incomeAvailable: number;
  totalBudgeted: number;
  toBudget: number;
  totalIncome: number;
  totalSpent: number;
  totalBalance: number;
  categoryGroups: BudgetCategoryGroup[];
}

/** Flattened category data for a single month (used by tabs) */
export interface CategoryMonth {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  balance: number;
  group_id: string;
}

/** Simplified month data with flattened categories (used by tabs) */
export interface MonthData {
  month: string;
  categories: CategoryMonth[];
}

export interface BudgetData {
  accounts: Account[];
  categories: Category[];
  categoryGroups: CategoryGroup[];
  payees: Payee[];
  transactions: Transaction[];
  months: MonthData[];
  budgetData: Record<string, BudgetMonth>;
}

export type Tab = 'overview' | 'transactions' | 'budget' | 'treemap';
