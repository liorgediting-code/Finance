import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  AppSettings,
  MonthData,
  IncomeEntry,
  ExpenseEntry,
} from '../types';

interface FinanceStore {
  settings: AppSettings;
  months: Record<number, MonthData>;

  // Income actions
  addIncome: (monthIndex: number, entry: Omit<IncomeEntry, 'id'>) => void;
  updateIncome: (monthIndex: number, id: string, partial: Partial<IncomeEntry>) => void;
  deleteIncome: (monthIndex: number, id: string) => void;

  // Expense actions
  addExpense: (monthIndex: number, entry: Omit<ExpenseEntry, 'id'>) => void;
  updateExpense: (monthIndex: number, id: string, partial: Partial<ExpenseEntry>) => void;
  deleteExpense: (monthIndex: number, id: string) => void;

  // Budget actions
  setBudget: (monthIndex: number, categoryId: string, amount: number) => void;

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

      addIncome: (monthIndex, entry) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          const newEntry: IncomeEntry = { ...entry, id: uuidv4() };
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                income: [...monthData.income, newEntry],
              },
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
                income: monthData.income.map((entry) =>
                  entry.id === id ? { ...entry, ...partial } : entry
                ),
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
                income: monthData.income.filter((entry) => entry.id !== id),
              },
            },
          };
        }),

      addExpense: (monthIndex, entry) =>
        set((state) => {
          const monthData = ensureMonth(state.months, monthIndex);
          const newEntry: ExpenseEntry = { ...entry, id: uuidv4() };
          return {
            months: {
              ...state.months,
              [monthIndex]: {
                ...monthData,
                expenses: [...monthData.expenses, newEntry],
              },
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
                expenses: monthData.expenses.map((entry) =>
                  entry.id === id ? { ...entry, ...partial } : entry
                ),
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
                expenses: monthData.expenses.filter((entry) => entry.id !== id),
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
                budget: {
                  ...monthData.budget,
                  [categoryId]: amount,
                },
              },
            },
          };
        }),

      updateSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...partial,
            spouseNames: {
              ...state.settings.spouseNames,
              ...(partial.spouseNames || {}),
            },
            savingsGoal: {
              ...state.settings.savingsGoal,
              ...(partial.savingsGoal || {}),
            },
          },
        })),

      loadDemoData: () =>
        set(() => {
          const demoMonths: Record<number, MonthData> = {
            0: {
              income: [
                {
                  id: uuidv4(),
                  date: '2026-01-01',
                  source: 'משכורת',
                  spouse: 'spouse1',
                  amount: 15000,
                  notes: 'משכורת חודשית',
                },
                {
                  id: uuidv4(),
                  date: '2026-01-01',
                  source: 'משכורת',
                  spouse: 'spouse2',
                  amount: 12000,
                  notes: 'משכורת חודשית',
                },
              ],
              expenses: [
                {
                  id: uuidv4(),
                  date: '2026-01-05',
                  categoryId: 'home',
                  subcategoryId: 'home-rent',
                  description: 'שכירות חודשית',
                  amount: 5500,
                  paymentMethod: 'transfer',
                  notes: '',
                },
                {
                  id: uuidv4(),
                  date: '2026-01-08',
                  categoryId: 'food',
                  subcategoryId: 'food-grocery',
                  description: 'קניות שבועיות',
                  amount: 1200,
                  paymentMethod: 'credit',
                  notes: '',
                },
                {
                  id: uuidv4(),
                  date: '2026-01-12',
                  categoryId: 'transport',
                  subcategoryId: 'transport-fuel',
                  description: 'דלק',
                  amount: 400,
                  paymentMethod: 'credit',
                  notes: '',
                },
              ],
              budget: {
                home: 7000,
                food: 3000,
                transport: 1500,
                children: 2000,
                health: 500,
                entertainment: 1000,
                shopping: 800,
                financial: 2000,
              },
            },
            1: {
              income: [
                {
                  id: uuidv4(),
                  date: '2026-02-01',
                  source: 'משכורת',
                  spouse: 'spouse1',
                  amount: 15000,
                  notes: 'משכורת חודשית',
                },
                {
                  id: uuidv4(),
                  date: '2026-02-01',
                  source: 'משכורת',
                  spouse: 'spouse2',
                  amount: 12000,
                  notes: 'משכורת חודשית',
                },
              ],
              expenses: [
                {
                  id: uuidv4(),
                  date: '2026-02-05',
                  categoryId: 'home',
                  subcategoryId: 'home-rent',
                  description: 'שכירות חודשית',
                  amount: 5500,
                  paymentMethod: 'transfer',
                  notes: '',
                },
                {
                  id: uuidv4(),
                  date: '2026-02-10',
                  categoryId: 'children',
                  subcategoryId: 'children-activities',
                  description: 'חוג כדורגל',
                  amount: 350,
                  paymentMethod: 'credit',
                  notes: '',
                },
              ],
              budget: {
                home: 7000,
                food: 3000,
                transport: 1500,
                children: 2000,
                health: 500,
                entertainment: 1000,
                shopping: 800,
                financial: 2000,
              },
            },
            2: {
              income: [
                {
                  id: uuidv4(),
                  date: '2026-03-01',
                  source: 'משכורת',
                  spouse: 'spouse1',
                  amount: 15000,
                  notes: 'משכורת חודשית',
                },
              ],
              expenses: [
                {
                  id: uuidv4(),
                  date: '2026-03-03',
                  categoryId: 'health',
                  subcategoryId: 'health-private',
                  description: 'רופא שיניים',
                  amount: 800,
                  paymentMethod: 'credit',
                  notes: '',
                },
              ],
              budget: {
                home: 7000,
                food: 3000,
                transport: 1500,
                children: 2000,
                health: 500,
                entertainment: 1000,
                shopping: 800,
                financial: 2000,
              },
            },
          };

          return {
            months: demoMonths,
            settings: {
              year: 2026,
              spouseNames: {
                spouse1: 'יוסי',
                spouse2: 'רונית',
              },
              savingsGoal: {
                monthlyTarget: 3000,
                vacationGoal: 15000,
                vacationSaved: 4500,
              },
            },
          };
        }),
    }),
    {
      name: 'finance-israel-store',
    }
  )
);
