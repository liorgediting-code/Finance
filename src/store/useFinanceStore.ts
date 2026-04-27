import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type {
  AppSettings,
  MonthData,
  IncomeEntry,
  ExpenseEntry,
  ExpenseSplit,
  SavingsFund,
  FamilyMember,
  Board,
  Installment,
  Mortgage,
  MortgageTrack,
  SavingsVehicle,
  Debt,
  LifeGoal,
  ChagBudget,
  ActivityEntry,
  CustomCategory,
} from '../types';

// ── Cloud-synced fields ───────────────────────────────────────────────────────
interface CloudData {
  settings: AppSettings;
  months: Record<number, MonthData>;
  savingsFunds: SavingsFund[];
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  familyMembers: FamilyMember[];
  extraBoards: Board[];
  // New modules
  installments: Installment[];
  mortgages: Mortgage[];
  savingsVehicles: SavingsVehicle[];
  debts: Debt[];
  lifeGoals: LifeGoal[];
  chagBudgets: ChagBudget[];
  activityLog: ActivityEntry[];
  // Rollover settings (#19)
  rolloverCategories: string[];
}

const DEFAULT_DATA: CloudData = {
  settings: {
    year: 2026,
    savingsGoal: { monthlyTarget: 0, vacationGoal: 0, vacationSaved: 0 },
    hiddenDashboardSections: [],
  },
  months: {},
  savingsFunds: [],
  recurringIncomes: [],
  recurringExpenses: [],
  familyMembers: [],
  extraBoards: [],
  installments: [],
  mortgages: [],
  savingsVehicles: [],
  debts: [],
  lifeGoals: [],
  chagBudgets: [],
  activityLog: [],
  rolloverCategories: [],
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

function updateExtraBoard(
  extraBoards: Board[],
  boardId: string,
  updater: (board: Board) => Board
): { extraBoards: Board[] } {
  const idx = extraBoards.findIndex((b) => b.id === boardId);
  if (idx === -1) return { extraBoards };
  const next = [...extraBoards];
  next[idx] = updater(next[idx]);
  return { extraBoards: next };
}

function makeActivityEntry(
  action: ActivityEntry['action'],
  entityType: ActivityEntry['entityType'],
  description: string,
  amount?: number,
  monthIndex?: number
): ActivityEntry {
  return { id: uuidv4(), timestamp: new Date().toISOString(), action, entityType, description, amount, monthIndex };
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
  updateRecurringIncome: (id: string, partial: Partial<Omit<IncomeEntry, 'id'>>) => void;
  deleteRecurringIncome: (id: string) => void;

  // Recurring expense actions
  addRecurringExpense: (entry: Omit<ExpenseEntry, 'id'>) => void;
  updateRecurringExpense: (id: string, partial: Partial<Omit<ExpenseEntry, 'id'>>) => void;
  deleteRecurringExpense: (id: string) => void;

  // Expense actions
  addExpense: (monthIndex: number, entry: Omit<ExpenseEntry, 'id'>) => void;
  updateExpense: (monthIndex: number, id: string, partial: Partial<ExpenseEntry>) => void;
  splitExpense: (monthIndex: number, id: string, splits: Omit<ExpenseSplit, 'id'>[]) => void;
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
  toggleDashboardSection: (section: string) => void;
  addCustomCategory: (cat: Omit<CustomCategory, 'id'>) => void;
  deleteCustomCategory: (id: string) => void;

  // Rollover (#19)
  toggleRolloverCategory: (categoryId: string) => void;
  getRolledBudget: (monthIndex: number, categoryId: string) => number;

  // Board state (non-synced)
  activeBoardId: string;
  setActiveBoard: (id: string) => void;

  // Board management
  addBoard: (name: string) => void;
  renameBoard: (id: string, name: string) => void;
  deleteBoard: (id: string) => void;
  setBoardColor: (id: string, color: string) => void;

  // Installments (#10)
  addInstallment: (entry: Omit<Installment, 'id'>) => void;
  updateInstallment: (id: string, partial: Partial<Omit<Installment, 'id'>>) => void;
  deleteInstallment: (id: string) => void;
  payInstallmentMonth: (id: string) => void;

  // Mortgage (#11)
  addMortgage: (mortgage: Omit<Mortgage, 'id'>) => void;
  updateMortgage: (id: string, partial: Partial<Omit<Mortgage, 'id'>>) => void;
  deleteMortgage: (id: string) => void;
  addMortgageTrack: (mortgageId: string, track: Omit<MortgageTrack, 'id'>) => void;
  updateMortgageTrack: (mortgageId: string, trackId: string, partial: Partial<Omit<MortgageTrack, 'id'>>) => void;
  deleteMortgageTrack: (mortgageId: string, trackId: string) => void;

  // Savings Vehicles (#13)
  addSavingsVehicle: (vehicle: Omit<SavingsVehicle, 'id'>) => void;
  updateSavingsVehicle: (id: string, partial: Partial<Omit<SavingsVehicle, 'id'>>) => void;
  deleteSavingsVehicle: (id: string) => void;

  // Debts (#23)
  addDebt: (debt: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, partial: Partial<Omit<Debt, 'id'>>) => void;
  deleteDebt: (id: string) => void;

  // Life Goals (#27)
  addLifeGoal: (goal: Omit<LifeGoal, 'id'>) => void;
  updateLifeGoal: (id: string, partial: Partial<Omit<LifeGoal, 'id'>>) => void;
  deleteLifeGoal: (id: string) => void;
  depositToLifeGoal: (id: string, amount: number) => void;

  // Chag Budgets (#28)
  addChagBudget: (budget: Omit<ChagBudget, 'id'>) => void;
  updateChagBudget: (id: string, partial: Partial<Omit<ChagBudget, 'id'>>) => void;
  deleteChagBudget: (id: string) => void;

  // Demo data
  loadDemoData: () => void;

  // Reset store to defaults (on sign-out)
  resetStore: () => void;
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
      return {
        settings: s.settings,
        months: s.months,
        savingsFunds: s.savingsFunds,
        recurringIncomes: s.recurringIncomes,
        recurringExpenses: s.recurringExpenses,
        familyMembers: s.familyMembers,
        extraBoards: s.extraBoards,
        installments: s.installments,
        mortgages: s.mortgages,
        savingsVehicles: s.savingsVehicles,
        debts: s.debts,
        lifeGoals: s.lifeGoals,
        chagBudgets: s.chagBudgets,
        activityLog: s.activityLog,
        rolloverCategories: s.rolloverCategories,
      };
    }
  );

  const logActivity = (
    action: ActivityEntry['action'],
    entityType: ActivityEntry['entityType'],
    description: string,
    amount?: number,
    monthIndex?: number
  ) => {
    const entry = makeActivityEntry(action, entityType, description, amount, monthIndex);
    set((s) => ({ activityLog: [entry, ...s.activityLog].slice(0, 200) }));
  };

  return {
    ...DEFAULT_DATA,
    _userId: null,
    activeBoardId: 'personal',

    setActiveBoard: (id) => { set({ activeBoardId: id }); },

    addBoard: (name) => {
      const AUTO_COLORS = ['#4A90C0', '#5A9A42', '#E06060', '#4AACAC', '#C89E50', '#C85590', '#C8A830'];
      set((s) => {
        const color = AUTO_COLORS[s.extraBoards.length % AUTO_COLORS.length];
        return {
          extraBoards: [
            ...s.extraBoards,
            { id: uuidv4(), name, color, months: {}, recurringIncomes: [], recurringExpenses: [] },
          ],
        };
      });
      sync();
    },

    renameBoard: (id, name) => {
      set((s) => updateExtraBoard(s.extraBoards, id, (b) => ({ ...b, name })));
      sync();
    },

    deleteBoard: (id) => {
      set((s) => ({ extraBoards: s.extraBoards.filter((b) => b.id !== id) }));
      sync();
    },

    setBoardColor: (id, color) => {
      set((s) => updateExtraBoard(s.extraBoards, id, (b) => ({ ...b, color })));
      sync();
    },

    loadFromCloud: async (userId) => {
      set({ _userId: userId });
      const { data } = await supabase.from('user_data').select('data').eq('user_id', userId).single();
      if (data?.data) {
        const d = data.data as Partial<CloudData>;
        set({
          settings: { ...DEFAULT_DATA.settings, ...(d.settings ?? {}) },
          months: d.months ?? {},
          savingsFunds: d.savingsFunds ?? [],
          recurringIncomes: d.recurringIncomes ?? [],
          recurringExpenses: d.recurringExpenses ?? [],
          familyMembers: d.familyMembers ?? [],
          extraBoards: d.extraBoards ?? [],
          installments: d.installments ?? [],
          mortgages: d.mortgages ?? [],
          savingsVehicles: d.savingsVehicles ?? [],
          debts: d.debts ?? [],
          lifeGoals: d.lifeGoals ?? [],
          chagBudgets: d.chagBudgets ?? [],
          activityLog: d.activityLog ?? [],
          rolloverCategories: d.rolloverCategories ?? [],
        });
      }
    },

    saveToCloud: async () => {
      const s = get();
      if (!s._userId) return;
      const data: CloudData = {
        settings: s.settings, months: s.months, savingsFunds: s.savingsFunds,
        recurringIncomes: s.recurringIncomes, recurringExpenses: s.recurringExpenses,
        familyMembers: s.familyMembers, extraBoards: s.extraBoards,
        installments: s.installments, mortgages: s.mortgages,
        savingsVehicles: s.savingsVehicles, debts: s.debts,
        lifeGoals: s.lifeGoals, chagBudgets: s.chagBudgets,
        activityLog: s.activityLog, rolloverCategories: s.rolloverCategories,
      };
      await supabase.from('user_data').upsert({ user_id: s._userId, data, updated_at: new Date().toISOString() });
    },

    // ── Family members ──────────────────────────────────────────────────────
    addFamilyMember: (name) => { set((s) => ({ familyMembers: [...s.familyMembers, { id: uuidv4(), name }] })); sync(); },
    updateFamilyMember: (id, name) => { set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === id ? { ...m, name } : m) })); sync(); },
    deleteFamilyMember: (id) => { set((s) => ({ familyMembers: s.familyMembers.filter((m) => m.id !== id) })); sync(); },

    // ── Income ─────────────────────────────────────────────────────────────
    addIncome: (monthIndex, entry) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, income: [...md.income, { ...entry, id: uuidv4() }] } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, income: [...md.income, { ...entry, id: uuidv4() }] } } };
        }));
      }
      logActivity('add', 'income', entry.source, entry.amount, monthIndex);
      sync();
    },

    updateIncome: (monthIndex, id, partial) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, income: md.income.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, income: md.income.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
        }));
      }
      sync();
    },

    deleteIncome: (monthIndex, id) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, income: md.income.filter((e) => e.id !== id) } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, income: md.income.filter((e) => e.id !== id) } } };
        }));
      }
      logActivity('delete', 'income', 'הכנסה נמחקה', undefined, monthIndex);
      sync();
    },

    addRecurringIncome: (entry) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringIncomes: [...s.recurringIncomes, { ...entry, id: uuidv4(), isRecurring: true }] }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringIncomes: [...b.recurringIncomes, { ...entry, id: uuidv4(), isRecurring: true }],
        })));
      }
      logActivity('add', 'income', `הכנסה קבועה: ${entry.source}`, entry.amount);
      sync();
    },

    updateRecurringIncome: (id, partial) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringIncomes: s.recurringIncomes.map((e) => e.id === id ? { ...e, ...partial } : e) }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringIncomes: b.recurringIncomes.map((e) => e.id === id ? { ...e, ...partial } : e),
        })));
      }
      sync();
    },

    deleteRecurringIncome: (id) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringIncomes: s.recurringIncomes.filter((e) => e.id !== id) }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringIncomes: b.recurringIncomes.filter((e) => e.id !== id),
        })));
      }
      sync();
    },

    // ── Recurring expenses ──────────────────────────────────────────────────
    addRecurringExpense: (entry) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringExpenses: [...s.recurringExpenses, { ...entry, id: uuidv4(), isRecurring: true }] }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringExpenses: [...b.recurringExpenses, { ...entry, id: uuidv4(), isRecurring: true }],
        })));
      }
      logActivity('add', 'expense', `הוצאה קבועה: ${entry.description || entry.categoryId}`, entry.amount);
      sync();
    },

    updateRecurringExpense: (id, partial) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringExpenses: s.recurringExpenses.map((e) => e.id === id ? { ...e, ...partial } : e) }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringExpenses: b.recurringExpenses.map((e) => e.id === id ? { ...e, ...partial } : e),
        })));
      }
      sync();
    },

    deleteRecurringExpense: (id) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => ({ recurringExpenses: s.recurringExpenses.filter((e) => e.id !== id) }));
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
          ...b, recurringExpenses: b.recurringExpenses.filter((e) => e.id !== id),
        })));
      }
      sync();
    },

    // ── Expenses ────────────────────────────────────────────────────────────
    addExpense: (monthIndex, entry) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, expenses: [...md.expenses, { ...entry, id: uuidv4() }] } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, expenses: [...md.expenses, { ...entry, id: uuidv4() }] } } };
        }));
      }
      if (!entry.isPending) {
        logActivity('add', 'expense', entry.description || entry.categoryId, entry.amount, monthIndex);
      }
      sync();
    },

    updateExpense: (monthIndex, id, partial) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, expenses: md.expenses.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, expenses: md.expenses.map((e) => e.id === id ? { ...e, ...partial } : e) } } };
        }));
      }
      sync();
    },

    splitExpense: (monthIndex, id, splitDefs) => {
      const splits: ExpenseSplit[] = splitDefs.map((s) => ({ ...s, id: uuidv4() }));
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, expenses: md.expenses.map((e) => e.id === id ? { ...e, splits } : e) } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, expenses: md.expenses.map((e) => e.id === id ? { ...e, splits } : e) } } };
        }));
      }
      sync();
    },

    deleteExpense: (monthIndex, id) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, expenses: md.expenses.filter((e) => e.id !== id) } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, expenses: md.expenses.filter((e) => e.id !== id) } } };
        }));
      }
      logActivity('delete', 'expense', 'הוצאה נמחקה', undefined, monthIndex);
      sync();
    },

    setBudget: (monthIndex, categoryId, amount) => {
      const { activeBoardId } = get();
      if (activeBoardId === 'personal') {
        set((s) => {
          const md = ensureMonth(s.months, monthIndex);
          return { months: { ...s.months, [monthIndex]: { ...md, budget: { ...md.budget, [categoryId]: amount } } } };
        });
      } else if (activeBoardId !== 'overall') {
        set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
          const md = ensureMonth(b.months, monthIndex);
          return { ...b, months: { ...b.months, [monthIndex]: { ...md, budget: { ...md.budget, [categoryId]: amount } } } };
        }));
      }
      sync();
    },

    // ── Savings ─────────────────────────────────────────────────────────────
    addSavingsFund: (fund) => { set((s) => ({ savingsFunds: [...s.savingsFunds, { ...fund, id: uuidv4() }] })); sync(); },
    updateSavingsFund: (id, updates) => { set((s) => ({ savingsFunds: s.savingsFunds.map((f) => f.id === id ? { ...f, ...updates } : f) })); sync(); },
    deleteSavingsFund: (id) => { set((s) => ({ savingsFunds: s.savingsFunds.filter((f) => f.id !== id) })); sync(); },

    depositToFund: (id, amount, monthIndex) => {
      const { activeBoardId } = get();
      set((s) => {
        const fund = s.savingsFunds.find((f) => f.id === id);
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
        const updatedFunds = s.savingsFunds.map((f) => f.id === id ? { ...f, savedAmount: f.savedAmount + amount } : f);
        if (activeBoardId === 'personal') {
          const md = ensureMonth(s.months, monthIndex);
          return {
            savingsFunds: updatedFunds,
            months: { ...s.months, [monthIndex]: { ...md, expenses: [...md.expenses, expense] } },
          };
        } else if (activeBoardId !== 'overall') {
          return {
            savingsFunds: updatedFunds,
            ...updateExtraBoard(s.extraBoards, activeBoardId, (b) => {
              const md = ensureMonth(b.months, monthIndex);
              return { ...b, months: { ...b.months, [monthIndex]: { ...md, expenses: [...md.expenses, expense] } } };
            }),
          };
        }
        return { savingsFunds: updatedFunds };
      });
      logActivity('add', 'savings', `הפקדה לחיסכון`, amount, monthIndex);
      sync();
    },

    updateSettings: (partial) => {
      set((s) => ({
        settings: { ...s.settings, ...partial, savingsGoal: { ...s.settings.savingsGoal, ...(partial.savingsGoal ?? {}) } },
      }));
      sync();
    },

    toggleDashboardSection: (section) => {
      set((s) => {
        const hidden = s.settings.hiddenDashboardSections ?? [];
        const next = hidden.includes(section)
          ? hidden.filter((h) => h !== section)
          : [...hidden, section];
        return { settings: { ...s.settings, hiddenDashboardSections: next } };
      });
      sync();
    },

    addCustomCategory: (cat) => {
      set((s) => {
        const existing = s.settings.customCategories ?? [];
        return { settings: { ...s.settings, customCategories: [...existing, { ...cat, id: uuidv4() }] } };
      });
      sync();
    },

    deleteCustomCategory: (id) => {
      set((s) => {
        const existing = s.settings.customCategories ?? [];
        return { settings: { ...s.settings, customCategories: existing.filter((c) => c.id !== id) } };
      });
      sync();
    },

    toggleRolloverCategory: (categoryId) => {
      set((s) => {
        const next = s.rolloverCategories.includes(categoryId)
          ? s.rolloverCategories.filter((c) => c !== categoryId)
          : [...s.rolloverCategories, categoryId];
        return { rolloverCategories: next };
      });
      sync();
    },

    getRolledBudget: (monthIndex, categoryId) => {
      const s = get();
      if (!s.rolloverCategories.includes(categoryId) || monthIndex === 0) return 0;
      const prevMonth = s.months[monthIndex - 1];
      if (!prevMonth) return 0;
      const prevBudget = prevMonth.budget[categoryId] ?? 0;
      if (prevBudget === 0) return 0;
      const prevSpent = prevMonth.expenses
        .filter((e) => e.categoryId === categoryId)
        .reduce((sum, e) => sum + e.amount, 0);
      return Math.max(0, prevBudget - prevSpent);
    },

    // ── Installments ────────────────────────────────────────────────────────
    addInstallment: (entry) => { set((s) => ({ installments: [...s.installments, { ...entry, id: uuidv4() }] })); sync(); },
    updateInstallment: (id, partial) => { set((s) => ({ installments: s.installments.map((i) => i.id === id ? { ...i, ...partial } : i) })); sync(); },
    deleteInstallment: (id) => { set((s) => ({ installments: s.installments.filter((i) => i.id !== id) })); sync(); },
    payInstallmentMonth: (id) => {
      set((s) => ({ installments: s.installments.map((i) => i.id === id ? { ...i, paidPayments: Math.min(i.paidPayments + 1, i.numPayments) } : i) }));
      sync();
    },

    // ── Mortgage ────────────────────────────────────────────────────────────
    addMortgage: (mortgage) => { set((s) => ({ mortgages: [...s.mortgages, { ...mortgage, id: uuidv4() }] })); sync(); },
    updateMortgage: (id, partial) => { set((s) => ({ mortgages: s.mortgages.map((m) => m.id === id ? { ...m, ...partial } : m) })); sync(); },
    deleteMortgage: (id) => { set((s) => ({ mortgages: s.mortgages.filter((m) => m.id !== id) })); sync(); },
    addMortgageTrack: (mortgageId, track) => {
      set((s) => ({ mortgages: s.mortgages.map((m) => m.id === mortgageId ? { ...m, tracks: [...m.tracks, { ...track, id: uuidv4() }] } : m) }));
      sync();
    },
    updateMortgageTrack: (mortgageId, trackId, partial) => {
      set((s) => ({ mortgages: s.mortgages.map((m) => m.id === mortgageId ? { ...m, tracks: m.tracks.map((t) => t.id === trackId ? { ...t, ...partial } : t) } : m) }));
      sync();
    },
    deleteMortgageTrack: (mortgageId, trackId) => {
      set((s) => ({ mortgages: s.mortgages.map((m) => m.id === mortgageId ? { ...m, tracks: m.tracks.filter((t) => t.id !== trackId) } : m) }));
      sync();
    },

    // ── Savings Vehicles ────────────────────────────────────────────────────
    addSavingsVehicle: (vehicle) => { set((s) => ({ savingsVehicles: [...s.savingsVehicles, { ...vehicle, id: uuidv4() }] })); sync(); },
    updateSavingsVehicle: (id, partial) => { set((s) => ({ savingsVehicles: s.savingsVehicles.map((v) => v.id === id ? { ...v, ...partial } : v) })); sync(); },
    deleteSavingsVehicle: (id) => { set((s) => ({ savingsVehicles: s.savingsVehicles.filter((v) => v.id !== id) })); sync(); },

    // ── Debts ────────────────────────────────────────────────────────────────
    addDebt: (debt) => { set((s) => ({ debts: [...s.debts, { ...debt, id: uuidv4() }] })); sync(); },
    updateDebt: (id, partial) => { set((s) => ({ debts: s.debts.map((d) => d.id === id ? { ...d, ...partial } : d) })); sync(); },
    deleteDebt: (id) => { set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })); sync(); },

    // ── Life Goals ──────────────────────────────────────────────────────────
    addLifeGoal: (goal) => { set((s) => ({ lifeGoals: [...s.lifeGoals, { ...goal, id: uuidv4() }] })); sync(); },
    updateLifeGoal: (id, partial) => { set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === id ? { ...g, ...partial } : g) })); sync(); },
    deleteLifeGoal: (id) => { set((s) => ({ lifeGoals: s.lifeGoals.filter((g) => g.id !== id) })); sync(); },
    depositToLifeGoal: (id, amount) => {
      set((s) => ({ lifeGoals: s.lifeGoals.map((g) => g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g) }));
      logActivity('add', 'savings', 'הפקדה למטרה', amount);
      sync();
    },

    // ── Chag Budgets ────────────────────────────────────────────────────────
    addChagBudget: (budget) => { set((s) => ({ chagBudgets: [...s.chagBudgets, { ...budget, id: uuidv4() }] })); sync(); },
    updateChagBudget: (id, partial) => { set((s) => ({ chagBudgets: s.chagBudgets.map((b) => b.id === id ? { ...b, ...partial } : b) })); sync(); },
    deleteChagBudget: (id) => { set((s) => ({ chagBudgets: s.chagBudgets.filter((b) => b.id !== id) })); sync(); },

    resetStore: () => {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      set({ ...DEFAULT_DATA, _userId: null, activeBoardId: 'personal' });
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
