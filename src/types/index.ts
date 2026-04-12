export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  spouse: 'spouse1' | 'spouse2';
  amount: number;
  notes: string;
  isRecurring?: boolean;
}

export interface ExpenseEntry {
  id: string;
  date: string;
  categoryId: string;
  subcategoryId: string;
  customCategory?: string;
  description: string;
  amount: number;
  paymentMethod: 'credit' | 'cash' | 'transfer' | 'check' | 'direct_debit';
  notes: string;
}

export interface MonthBudget {
  [categoryId: string]: number;
}

export interface MonthData {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  budget: MonthBudget;
}

export interface SavingsGoal {
  monthlyTarget: number;
  vacationGoal: number;
  vacationSaved: number;
}

export interface SavingsFund {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
  notes: string;
}

export interface SpouseNames {
  spouse1: string;
  spouse2: string;
}

export interface AppSettings {
  year: number;
  spouseNames: SpouseNames;
  savingsGoal: SavingsGoal;
}

export interface SubCategory {
  id: string;
  nameHe: string;
}

export interface Category {
  id: string;
  nameHe: string;
  color: string;
  subcategories: SubCategory[];
}
