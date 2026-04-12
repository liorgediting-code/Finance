export interface FamilyMember {
  id: string;
  name: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  source: string;
  memberId: string;
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
  isRecurring?: boolean;
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

export interface AppSettings {
  year: number;
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
