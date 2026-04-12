import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  AppSettings,
  MonthData,
  IncomeEntry,
  ExpenseEntry,
  SavingsFund,
} from '../types';

interface FinanceStore {
  settings: AppSettings;
  months: Record<number, MonthData>;
  savingsFunds: SavingsFund[];
  recurringIncomes: IncomeEntry[];

  // Income actions
  addIncome: (monthIndex: number, entry: Omit<IncomeEntry, 'id'>) => void;
  updateIncome: (monthIndex: number, id: string, partial: Partial<IncomeEntry>) => void;
  deleteIncome: (monthIndex: number, id: string) => void;

  // Recurring income actions
  addRecurringIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  deleteRecurringIncome: (id: string) => void;

  // Expense actions
  addExpense: (monthIndex: number, entry: Omit<ExpenseEntry, 'id'>) => void;
  updateExpense: (monthIndex: number, id: string, partial: Partial<ExpenseEntry>) => void;
  deleteExpense: (monthIndex: number, id: string) => void;

  // Budget actions
  setBudget: (monthIndex: number, categoryId: string, amount: number) => void;

  // Savings funds actions
  addSavingsFund: (fund: Omit<SavingsFund, 'id'>) => void;
  updateSavingsFund: (id: string, updates: Partial<Omit<SavingsFund, 'id'>>) => void;
  deleteSavingsFund: (id: string) => void;
  depositToFund: (id: string, amount: number, monthIndex: number) => void;

  // Settings actions
  updateSettings: (partial: Partial<AppSettings>) => void;

  // Demo data
  loadDemoData: () => void;
}

function ensureMonth(months: Record<number, MonthData>, monthIndex: number): MonthData {
  if (!months[monthIndex]) {
    return { income: [], expenses: [], budget: {} };
  }
  return months[monthIndex];
}

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      settings: {
        year: 2026,
        spouseNames: {
          spouse1: 'בן/בת זוג 1',
          spouse2: 'בן/בת זוג 2',
        },
        savingsGoal: {
          monthlyTarget: 0,
          vacationGoal: 0,
          vacationSaved: 0,
        },
      },

      months: {},
      savingsFunds: [],
      recurringIncomes: [],

      addIncome: (monthIndex, entry) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          const newEntry: IncomeEntry = { ...entry, id: uuidv4() };
          return {
            months: {
              ...state.months,
              [monthIndex]: { ...monthData, income: [...monthData.income, newEntry] },
            },
          };
        }),

      updateIncome: (monthIndex, id, partial) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                income: monthData.income.map((e) => (e.id === id ? { ...e, ...partial } : e)),
              },
            },
          };
        }),

      deleteIncome: (monthIndex, id) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                income: monthData.income.filter((e) => e.id !== id),
              },
            },
          };
        }),

      addRecurringIncome: (entry) =>
        set((state) => ({
          recurringIncomes: [
            ...state.recurringIncomes,
            { ...entry, id: uuidv4(), isRecurring: true },
          ],
        })),

      deleteRecurringIncome: (id) =>
        set((state) => ({
          recurringIncomes: state.recurringIncomes.filter((e) => e.id !== id),
        })),

      addExpense: (monthIndex, entry) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          const newEntry: ExpenseEntry = { ...entry, id: uuidv4() };
          return {
            months: {
              ...state.months,
              [monthIndex]: { ...monthData, expenses: [...monthData.expenses, newEntry] },
            },
          };
        }),

      updateExpense: (monthIndex, id, partial) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                expenses: monthData.expenses.map((e) => (e.id === id ? { ...e, ...partial } : e)),
              },
            },
          };
        }),

      deleteExpense: (monthIndex, id) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                expenses: monthData.expenses.filter((e) => e.id !== id),
              },
            },
          };
        }),

      setBudget: (monthIndex, categoryId, amount) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                budget: { ...monthData.budget, [categoryId]: amount },
              },
            },
          };
        }),

      addSavingsFund: (fund) =>
        set((state) => ({
          savingsFunds: [...state.savingsFunds, { ...fund, id: uuidv4() }],
        })),

      updateSavingsFund: (id, updates) =>
        set((state) => ({
          savingsFunds: state.savingsFunds.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),

      deleteSavingsFund: (id) =>
        set((state) => ({
          savingsFunds: state.savingsFunds.filter((f) => f.id !== id),
        })),

      depositToFund: (id, amount, monthIndex) =>
        set((state) => {
          const fund = state.savingsFunds.find((f) => f.id === id);
          const monthData = ensureMonth(state.months, monthIndex);
          const expenseEntry: ExpenseEntry = {
            id: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            categoryId: 'savings',
            subcategoryId: 'savings-monthly',
            description: fund ? `חיסכון: ${fund.name}` : 'הפקדה לחיסכון',
            amount,
            paymentMethod: 'transfer',
            notes: '',
          };
          return {
            savingsFunds: state.savingsFunds.map((f) =>
              f.id === id ? { ...f, savedAmount: f.savedAmount + amount } : f
            ),
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                expenses: [...monthData.expenses, expenseEntry],
              },
            },
          };
        }),

      updateSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial,
            spouseNames: { ...state.settings.spouseNames, ...(partial.spouseNames || {}) },
            savingsGoal: { ...state.settings.savingsGoal, ...(partial.savingsGoal || {}) },
          },
        })),

      loadDemoData: () =>
        set(() => ({
          months: {
            0: {
              income: [
                { id: uuidv4(), date: '2026-01-01', source: 'משכורת', spouse: 'spouse1', amount: 15000, notes: '' },
                { id: uuidv4(), date: '2026-01-01', source: 'משכורת', spouse: 'spouse2', amount: 12000, notes: '' },
              ],
              expenses: [
                { id: uuidv4(), date: '2026-01-05', categoryId: 'home', subcategoryId: 'home-rent', description: 'שכירות', amount: 5500, paymentMethod: 'transfer', notes: '' },
                { id: uuidv4(), date: '2026-01-08', categoryId: 'food', subcategoryId: 'food-grocery', description: 'קניות', amount: 1200, paymentMethod: 'credit', notes: '' },
                { id: uuidv4(), date: '2026-01-12', categoryId: 'transport', subcategoryId: 'transport-fuel', description: 'דלק', amount: 400, paymentMethod: 'credit', notes: '' },
              ],
              budget: { home: 7000, food: 3000, transport: 1500, children: 2000, health: 500, entertainment: 1000 },
            },
            1: {
              income: [
                { id: uuidv4(), date: '2026-02-01', source: 'משכורת', spouse: 'spouse1', amount: 15000, notes: '' },
                { id: uuidv4(), date: '2026-02-01', source: 'משכורת', spouse: 'spouse2', amount: 12000, notes: '' },
              ],
              expenses: [
                { id: uuidv4(), date: '2026-02-05', categoryId: 'home', subcategoryId: 'home-rent', description: 'שכירות', amount: 5500, paymentMethod: 'transfer', notes: '' },
                { id: uuidv4(), date: '2026-02-10', categoryId: 'children', subcategoryId: 'children-activities', description: 'חוג', amount: 350, paymentMethod: 'credit', notes: '' },
              ],
              budget: { home: 7000, food: 3000, transport: 1500, children: 2000 },
            },
            2: {
              income: [
                { id: uuidv4(), date: '2026-03-01', source: 'משכורת', spouse: 'spouse1', amount: 15000, notes: '' },
              ],
              expenses: [
                { id: uuidv4(), date: '2026-03-03', categoryId: 'health', subcategoryId: 'health-private', description: 'רופא שיניים', amount: 800, paymentMethod: 'credit', notes: '' },
              ],
              budget: { home: 7000, food: 3000, health: 500 },
            },
            3: {
              income: [
                { id: uuidv4(), date: '2026-04-01', source: 'משכורת', spouse: 'spouse1', amount: 15000, notes: '' },
                { id: uuidv4(), date: '2026-04-01', source: 'משכורת', spouse: 'spouse2', amount: 12000, notes: '' },
              ],
              expenses: [
                { id: uuidv4(), date: '2026-04-02', categoryId: 'home', subcategoryId: 'home-rent', description: 'שכירות', amount: 5500, paymentMethod: 'transfer', notes: '' },
                { id: uuidv4(), date: '2026-04-05', categoryId: 'food', subcategoryId: 'food-grocery', description: 'קניות שבועיות', amount: 1400, paymentMethod: 'credit', notes: '' },
                { id: uuidv4(), date: '2026-04-07', categoryId: 'transport', subcategoryId: 'transport-fuel', description: 'דלק', amount: 380, paymentMethod: 'credit', notes: '' },
                { id: uuidv4(), date: '2026-04-10', categoryId: 'entertainment', subcategoryId: 'entertainment-restaurants', description: 'ארוחת ערב', amount: 280, paymentMethod: 'credit', notes: '' },
                { id: uuidv4(), date: '2026-04-12', categoryId: 'children', subcategoryId: 'children-education', description: 'ספרי לימוד', amount: 220, paymentMethod: 'cash', notes: '' },
              ],
              budget: { home: 7000, food: 3000, transport: 1500, children: 2000, entertainment: 1000 },
            },
          },
          settings: {
            year: 2026,
            spouseNames: { spouse1: 'יוסי', spouse2: 'רונית' },
            savingsGoal: { monthlyTarget: 3000, vacationGoal: 15000, vacationSaved: 4500 },
          },
          savingsFunds: [
            { id: uuidv4(), name: 'חופשה לאירופה', targetAmount: 15000, savedAmount: 4500, color: '#B8CCE0', notes: 'קיץ 2027' },
            { id: uuidv4(), name: 'קרן חירום', targetAmount: 30000, savedAmount: 12000, color: '#C5CDB6', notes: '3 משכורות' },
            { id: uuidv4(), name: 'רכב חדש', targetAmount: 80000, savedAmount: 8000, color: '#E8CFA8', notes: '' },
          ],
        })),
    }),
    { name: 'finance-israel-store' }
  )
);
