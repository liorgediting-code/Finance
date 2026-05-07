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
  isFuture?: boolean;
}

export interface ExpenseSplit {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
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
  cancelUrl?: string;
  memberId?: string;
  isPending?: boolean;
  isFuture?: boolean;
  splits?: ExpenseSplit[];
  linkedSourceId?: string;
  linkedSourceType?: 'installment' | 'mortgage-track' | 'debt' | 'savings-vehicle' | 'life-goal';
}

export interface MonthBudget {
  [categoryId: string]: number;
}

export interface MonthData {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  budget: MonthBudget;
  note?: string; // Feature: month-journal
}

// ── Wishlist (#NEW) ───────────────────────────────────────────────────────────
export type WishlistPriority = 'low' | 'medium' | 'high';

export interface WishlistItem {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  priority: WishlistPriority;
  notes: string;
  targetDate?: string; // YYYY-MM
  purchased: boolean;
  purchasedDate?: string; // YYYY-MM-DD
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

// ── Custom Category (#18) ──────────────────────────────────────────────────────
export interface CustomCategory {
  id: string;
  nameHe: string;
  color: string;
}

export interface AppSettings {
  year: number;
  savingsGoal: SavingsGoal;
  hiddenDashboardSections?: string[];
  customCategories?: CustomCategory[];
  hasCompletedOnboarding?: boolean;
  enabledModules?: string[];
  primaryGoal?: string;
  emergencyFundId?: string; // which savings fund is the emergency fund
}

// ── Net Worth History (#NEW) ──────────────────────────────────────────────────
export interface NetWorthSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  assets: number;
  liabilities: number;
  netWorth: number;
  notes: string;
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

export interface Board {
  id: string;
  name: string;
  color?: string;
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
}

// ── Installments (#10) ────────────────────────────────────────────────────────

export interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  numPayments: number;
  paidPayments: number;
  startMonth: number; // 0-11
  startYear: number;
  categoryId: string;
  notes: string;
}

// ── Mortgage (#11) ────────────────────────────────────────────────────────────

export type MortgageTrackType = 'prime' | 'fixed' | 'cpi' | 'variable';

export interface MortgageTrack {
  id: string;
  type: MortgageTrackType;
  balance: number;
  monthlyPayment: number;
  interestRate: number;
  remainingMonths: number;
  notes: string;
}

export interface Mortgage {
  id: string;
  name: string;
  tracks: MortgageTrack[];
  notes: string;
}

// ── Israeli Savings Vehicles (#13) ────────────────────────────────────────────

export type SavingsVehicleType = 'keren_hishtalmut' | 'pension' | 'kupat_gemel' | 'child_savings';

export interface SavingsVehicle {
  id: string;
  type: SavingsVehicleType;
  name: string;
  balance: number;
  employeeMonthlyDeposit: number;
  employerMonthlyDeposit: number;
  notes: string;
  lockDate?: string;      // keren hishtalmut - eligible withdrawal date
  childName?: string;     // child savings - child name
}

// ── Debt Planner (#23) ────────────────────────────────────────────────────────

export type DebtType = 'credit_card' | 'personal_loan' | 'car_loan' | 'overdraft' | 'other';

export interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  type: DebtType;
  notes: string;
}

// ── Life Goals (#27) ──────────────────────────────────────────────────────────

export interface LifeGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string; // YYYY-MM
  monthlyContribution: number;
  color: string;
  notes: string;
}

// ── Chag Budgets (#28) ────────────────────────────────────────────────────────

export interface ChagBudgetItem {
  name: string;
  budget: number;
  spent: number;
}

export interface ChagBudget {
  id: string;
  chagName: string;
  year: number;
  items: ChagBudgetItem[];
  notes: string;
}

// ── Savings Challenge ─────────────────────────────────────────────────────────

export interface SavingsChallenge {
  id: string;
  name: string;
  weeklyBase: number; // amount × week number (e.g. ₪50 → week 1=₪50, week 2=₪100...)
  startDate: string; // YYYY-MM-DD
  completedWeeks: number[]; // week numbers 1-52 that are marked done
  notes: string;
}

// ── Activity Log (#33) ────────────────────────────────────────────────────────

export type ActivityAction = 'add' | 'update' | 'delete';
export type ActivityEntityType = 'expense' | 'income' | 'savings' | 'budget' | 'goal' | 'debt';

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO
  action: ActivityAction;
  entityType: ActivityEntityType;
  description: string;
  amount?: number;
  monthIndex?: number;
}
