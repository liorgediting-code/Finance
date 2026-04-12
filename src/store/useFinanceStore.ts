import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type {
  AppSettings,
  MonthData,
  IncomeEntry,
  ExpenseEntry,
  SavingsFund,
  FamilyMember,
} from '../types';

// ── Cloud-synced fields ───────────────────────────────────────────────────────
interface CloudData {
  settings: AppSettings;
  months: Record<number, MonthData>;
  savingsFunds: SavingsFund[];
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  familyMembers: FamilyMember[];
}

const DEFAULT_DATA: CloudData = {
  settings: {
    year: 2026,
    savingsGoal: { monthlyTarget: 0, vacationGoal: 0, vacationSaved: 0 },
  },
  months: {},
  savingsFunds: [],
  recurringIncomes: [],
  recurringExpenses: [],
  familyMembers: [
    { id: 'member-1', name: 'בן/בת זוג 1' },
    { id: 'member-2', name: 'בן/בת זוג 2' },
  ],
};

// ── Debounced save ────────────────────────────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync(getUserId: () => string | null, getState: () => CloudData) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const userId = getUserId();
    if (!userId) return;
    const data = getState();
    await supabase.from('user_data').upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  }, 1000);
}

// ── Store interface ───────────────────────────────────────────────────────────
interface FinanceStore extends CloudData {
  _userId: string | null;

  // Cloud sync
  loadFromCloud: (userId: string) => Promise<void>;
  saveToCloud: () => Promise<void>;

  // Family member actions
  addFamilyMember: (name: string) => void;
  updateFamilyMember: (id: string, name: string) => void;
  deleteFamilyMember: (id: string) => void;

  // Income actions
  addIncome: (monthIndex: number, entry: Omit<IncomeEntry, 'id'>) => void;
  updateIncome: (monthIndex: number, id: string, partial: Partial<IncomeEntry>) => void;
  deleteIncome: (monthIndex: number, id: string) => void;

  // Recurring income actions
  addRecurringIncome: (entry: Omit<IncomeEntry, 'id'>) => void;
  deleteRecurringIncome: (id: string) => void;

  // Recurring expense actions
  addRecurringExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  deleteRecurringExpense: (id: string) => void;

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
  return months[monthIndex] ?? { income: [], expenses: [], budget: {} };
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useFinanceStore = create<FinanceStore>()((set, get) => {
  const sync = () => scheduleSync(
    () => get()._userId,
    () => {
      const s = get();
      return { settings: s.settings, months: s.months, savingsFunds: s.savingsFunds, recurringIncomes: s.recurringIncomes, recurringExpenses: s.recurringExpenses, familyMembers: s.familyMembers };
    }
  );

  return {
    ...DEFAULT_DATA,
    _userId: null,

    loadFromCloud: async (userId) => {
      set({ _userId: userId });
      const { data } = await supabase.from('user_data').select('data').eq('user_id', userId).single();
      if (data?.data) {
        const d = data.data as Partial<CloudData>;
        set({
          settings: d.settings ?? DEFAULT_DATA.settings,
          months: d.months ?? {},
          savingsFunds: d.savingsFunds ?? [],
          recurringIncomes: d.recurringIncomes ?? [],
          recurringExpenses: d.recurringExpenses ?? [],
          familyMembers: d.familyMembers ?? DEFAULT_DATA.familyMembers,
        });
      }
    },

    saveToCloud: async () => {
      const s = get();
      if (!s._userId) return;
      const data: CloudData = { settings: s.settings, months: s.months, savingsFunds: s.savingsFunds, recurringIncomes: s.recurringIncomes, recurringExpenses: s.recurringExpenses, familyMembers: s.familyMembers };
      await supabase.from('user_data').upsert({ user_id: s._userId, data, updated_at: new Date().toISOString() });
    },

    // ── Family members ──────────────────────────────────────────────────────
    addFamilyMember: (name) => { set((s) => ({ familyMembers: [...s.familyMembers, { id: uuidv4(), name }] })); sync(); },
    updateFamilyMember: (id, name) => { set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === id ? { ...m, name } : m) })); sync(); },
    deleteFamilyMember: (id) => { set((s) => ({ familyMembers: s.familyMembers.filter((m) => m.id !== id) })); sync(); },

    // ── Income ─────────────────────────────────────────────────────────────
    addIncome: (monthIndex, entry) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, income: [...md.income, { ...entry, id: uuidv4() }] } } };
      });
      sync();
    },

    updateIncome: (monthIndex, id, partial) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, income: md.income.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
      });
      sync();
    },

    deleteIncome: (monthIndex, id) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, income: md.income.filter((e) => e.id !== id) } } };
      });
      sync();
    },

    addRecurringIncome: (entry) => { set((s) => ({ recurringIncomes: [...s.recurringIncomes, { ...entry, id: uuidv4(), isRecurring: true }] })); sync(); },
    deleteRecurringIncome: (id) => { set((s) => ({ recurringIncomes: s.recurringIncomes.filter((e) => e.id !== id) })); sync(); },

    // ── Recurring expenses ──────────────────────────────────────────────────
    addRecurringExpense: (entry) => { set((s) => ({ recurringExpenses: [...s.recurringExpenses, { ...entry, id: uuidv4(), isRecurring: true }] })); sync(); },
    deleteRecurringExpense: (id) => { set((s) => ({ recurringExpenses: s.recurringExpenses.filter((e) => e.id !== id) })); sync(); },

    // ── Expenses ────────────────────────────────────────────────────────────
    addExpense: (monthIndex, entry) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, expenses: [...md.expenses, { ...entry, id: uuidv4() }] } } };
      });
      sync();
    },

    updateExpense: (monthIndex, id, partial) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, expenses: md.expenses.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
      });
      sync();
    },

    deleteExpense: (monthIndex, id) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, expenses: md.expenses.filter((e) => e.id !== id) } } };
      });
      sync();
    },

    setBudget: (monthIndex, categoryId, amount) => {
      set((s) => {
        const md = ensureMonth(s.months, monthIndex);
        return { months: { ...s.months, [monthIndex]: { ...md, budget: { ...md.budget, [categoryId]: amount } } } };
      });
      sync();
    },

    // ── Savings ─────────────────────────────────────────────────────────────
    addSavingsFund: (fund) => { set((s) => ({ savingsFunds: [...s.savingsFunds, { ...fund, id: uuidv4() }] })); sync(); },
    updateSavingsFund: (id, updates) => { set((s) => ({ savingsFunds: s.savingsFunds.map((f) => f.id === id ? { ...f, ...updates } : f) })); sync(); },
    deleteSavingsFund: (id) => { set((s) => ({ savingsFunds: s.savingsFunds.filter((f) => f.id !== id) })); sync(); },

    depositToFund: (id, amount, monthIndex) => {
      set((s) => {
        const fund = s.savingsFunds.find((f) => f.id === id);
        const md = ensureMonth(s.months, monthIndex);
        const expense: ExpenseEntry = {
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
          savingsFunds: s.savingsFunds.map((f) => f.id === id ? { ...f, savedAmount: f.savedAmount + amount } : f),
          months: { ...s.months, [monthIndex]: { ...md, expenses: [...md.expenses, expense] } },
        };
      });
      sync();
    },

    updateSettings: (partial) => {
      set((s) => ({
        settings: { ...s.settings, ...partial, savingsGoal: { ...s.settings.savingsGoal, ...(partial.savingsGoal ?? {}) } },
      }));
      sync();
    },

    loadDemoData: () => {
      const m1 = uuidv4();
      const m2 = uuidv4();
      set({
        familyMembers: [{ id: m1, name: 'יוסי' }, { id: m2, name: 'רונית' }],
        months: {
          0: {
            income: [
              { id: uuidv4(), date: '2026-01-01', source: 'משכורת', memberId: m1, amount: 15000, notes: '' },
              { id: uuidv4(), date: '2026-01-01', source: 'משכורת', memberId: m2, amount: 12000, notes: '' },
            ],
            expenses: [
              { id: uuidv4(), date: '2026-01-05', categoryId: 'home', subcategoryId: 'home-rent', description: 'שכירות', amount: 5500, paymentMethod: 'transfer', notes: '' },
              { id: uuidv4(), date: '2026-01-08', categoryId: 'food', subcategoryId: 'food-grocery', description: 'קניות', amount: 1200, paymentMethod: 'credit', notes: '' },
            ],
            budget: { home: 7000, food: 3000, transport: 1500 },
          },
          3: {
            income: [
              { id: uuidv4(), date: '2026-04-01', source: 'משכורת', memberId: m1, amount: 15000, notes: '' },
              { id: uuidv4(), date: '2026-04-01', source: 'משכורת', memberId: m2, amount: 12000, notes: '' },
            ],
            expenses: [
              { id: uuidv4(), date: '2026-04-02', categoryId: 'home', subcategoryId: 'home-rent', description: 'שכירות', amount: 5500, paymentMethod: 'transfer', notes: '' },
              { id: uuidv4(), date: '2026-04-05', categoryId: 'food', subcategoryId: 'food-grocery', description: 'קניות', amount: 1400, paymentMethod: 'credit', notes: '' },
            ],
            budget: { home: 7000, food: 3000 },
          },
        },
        settings: { year: 2026, savingsGoal: { monthlyTarget: 3000, vacationGoal: 15000, vacationSaved: 4500 } },
        savingsFunds: [
          { id: uuidv4(), name: 'חופשה לאירופה', targetAmount: 15000, savedAmount: 4500, color: '#B8CCE0', notes: 'קיץ 2027' },
          { id: uuidv4(), name: 'קרן חירום', targetAmount: 30000, savedAmount: 12000, color: '#C5CDB6', notes: '3 משכורות' },
        ],
        recurringIncomes: [],
        recurringExpenses: [],
      });
      sync();
    },
  };
});
