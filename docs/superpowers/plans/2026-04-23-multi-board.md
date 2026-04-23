# Multi-Board Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multiple financial boards (e.g. "Personal", "Business") with an overall read-only summary, while leaving all existing UI layout and visual design completely unchanged.

**Architecture:** Existing `months`/`recurringIncomes`/`recurringExpenses` in `CloudData` remain as the permanent "Personal" board. A new `extraBoards: Board[]` field holds additional boards. A non-synced `activeBoardId` in the store drives which board's data components read and mutations write to. When `activeBoardId === 'overall'`, `MonthDashboard` renders a new read-only `OverallDashboard` instead of the normal content.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4, Vite — all pre-existing.

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/types/index.ts` | Add `Board` interface |
| Modify | `src/store/useFinanceStore.ts` | Add `extraBoards`, `activeBoardId`, board actions, board-aware mutations |
| Create | `src/store/useActiveBoardData.ts` | Hook returning active board's months/recurring |
| Modify | `src/components/layout/Sidebar.tsx` | Add boards section above existing nav |
| Modify | `src/components/dashboard/MonthDashboard.tsx` | Branch on overall, pass board data to CSV export |
| Modify | `src/components/dashboard/AnnualSummary.tsx` | Use `useActiveBoardData` |
| Modify | `src/components/dashboard/ExpenseCategoryBarChart.tsx` | Use `useActiveBoardData` |
| Modify | `src/components/month/MonthSummary.tsx` | Use `useActiveBoardData` |
| Modify | `src/components/month/ExpenseBudgetSection.tsx` | Use `useActiveBoardData` |
| Modify | `src/components/month/IncomeTable.tsx` | Use `useActiveBoardData` |
| Create | `src/components/dashboard/OverallDashboard.tsx` | Read-only aggregated summary |

---

## Task 1: Add `Board` type to `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the `Board` interface** — append at the bottom of `src/types/index.ts`:

```typescript
export interface Board {
  id: string;
  name: string;
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
}
```

- [ ] **Step 2: Verify build still passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```
Expected: `✓ built in` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Board type for multi-board support"
```

---

## Task 2: Extend the Zustand store with board state and management actions

**Files:**
- Modify: `src/store/useFinanceStore.ts`

- [ ] **Step 1: Add `Board` to imports** — update the import at the top of `src/store/useFinanceStore.ts`:

```typescript
import type {
  AppSettings,
  MonthData,
  IncomeEntry,
  ExpenseEntry,
  SavingsFund,
  FamilyMember,
  Board,
} from '../types';
```

- [ ] **Step 2: Add `extraBoards` to `CloudData`** — update the `CloudData` interface:

```typescript
interface CloudData {
  settings: AppSettings;
  months: Record<number, MonthData>;
  savingsFunds: SavingsFund[];
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  familyMembers: FamilyMember[];
  extraBoards: Board[];
}
```

- [ ] **Step 3: Update `DEFAULT_DATA`** — add `extraBoards: []` to the default:

```typescript
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
  extraBoards: [],
};
```

- [ ] **Step 4: Add a module-level helper for updating extra boards** — add after the `scheduleSync` function:

```typescript
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
```

- [ ] **Step 5: Add board management actions to `FinanceStore` interface** — add after `updateSettings`:

```typescript
// Board state (non-synced)
activeBoardId: string;
setActiveBoard: (id: string) => void;

// Board management
addBoard: (name: string) => void;
renameBoard: (id: string, name: string) => void;
deleteBoard: (id: string) => void;
```

- [ ] **Step 6: Update the sync closure to include `extraBoards`** — update the `sync` helper inside the store factory:

```typescript
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
    };
  }
);
```

- [ ] **Step 7: Add `activeBoardId` initial state and board actions** — add inside the store return object after `_userId: null`:

```typescript
activeBoardId: 'personal',

setActiveBoard: (id) => { set({ activeBoardId: id }); },

addBoard: (name) => {
  set((s) => ({
    extraBoards: [
      ...s.extraBoards,
      { id: uuidv4(), name, months: {}, recurringIncomes: [], recurringExpenses: [] },
    ],
  }));
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
```

- [ ] **Step 8: Update `loadFromCloud` to default `extraBoards`** — inside `loadFromCloud`, update the `set` call:

```typescript
set({
  settings: d.settings ?? DEFAULT_DATA.settings,
  months: d.months ?? {},
  savingsFunds: d.savingsFunds ?? [],
  recurringIncomes: d.recurringIncomes ?? [],
  recurringExpenses: d.recurringExpenses ?? [],
  familyMembers: d.familyMembers ?? DEFAULT_DATA.familyMembers,
  extraBoards: d.extraBoards ?? [],
});
```

- [ ] **Step 9: Update `saveToCloud` to include `extraBoards`**:

```typescript
saveToCloud: async () => {
  const s = get();
  if (!s._userId) return;
  const data: CloudData = {
    settings: s.settings,
    months: s.months,
    savingsFunds: s.savingsFunds,
    recurringIncomes: s.recurringIncomes,
    recurringExpenses: s.recurringExpenses,
    familyMembers: s.familyMembers,
    extraBoards: s.extraBoards,
  };
  await supabase.from('user_data').upsert({ user_id: s._userId, data, updated_at: new Date().toISOString() });
},
```

- [ ] **Step 10: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 11: Commit**

```bash
git add src/store/useFinanceStore.ts
git commit -m "feat: add extraBoards and activeBoardId to store with board management actions"
```

---

## Task 3: Make all mutation actions board-aware

**Files:**
- Modify: `src/store/useFinanceStore.ts`

All actions that write to `months`, `recurringIncomes`, or `recurringExpenses` must check `activeBoardId`. When `'personal'`, existing behavior. Otherwise, write into `extraBoards[i]`. When `'overall'`, no-op.

- [ ] **Step 1: Update `addIncome`**:

```typescript
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
  sync();
},
```

- [ ] **Step 2: Update `updateIncome`**:

```typescript
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
```

- [ ] **Step 3: Update `deleteIncome`**:

```typescript
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
  sync();
},
```

- [ ] **Step 4: Update `addRecurringIncome`**:

```typescript
addRecurringIncome: (entry) => {
  const { activeBoardId } = get();
  if (activeBoardId === 'personal') {
    set((s) => ({ recurringIncomes: [...s.recurringIncomes, { ...entry, id: uuidv4(), isRecurring: true }] }));
  } else if (activeBoardId !== 'overall') {
    set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
      ...b, recurringIncomes: [...b.recurringIncomes, { ...entry, id: uuidv4(), isRecurring: true }],
    })));
  }
  sync();
},
```

- [ ] **Step 5: Update `deleteRecurringIncome`**:

```typescript
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
```

- [ ] **Step 6: Update `addRecurringExpense`**:

```typescript
addRecurringExpense: (entry) => {
  const { activeBoardId } = get();
  if (activeBoardId === 'personal') {
    set((s) => ({ recurringExpenses: [...s.recurringExpenses, { ...entry, id: uuidv4(), isRecurring: true }] }));
  } else if (activeBoardId !== 'overall') {
    set((s) => updateExtraBoard(s.extraBoards, activeBoardId, (b) => ({
      ...b, recurringExpenses: [...b.recurringExpenses, { ...entry, id: uuidv4(), isRecurring: true }],
    })));
  }
  sync();
},
```

- [ ] **Step 7: Update `deleteRecurringExpense`**:

```typescript
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
```

- [ ] **Step 8: Update `addExpense`**:

```typescript
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
  sync();
},
```

- [ ] **Step 9: Update `updateExpense`**:

```typescript
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
```

- [ ] **Step 10: Update `deleteExpense`**:

```typescript
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
  sync();
},
```

- [ ] **Step 11: Update `setBudget`**:

```typescript
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
```

- [ ] **Step 12: Update `depositToFund`** — the expense it creates must go to the active board:

```typescript
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
  sync();
},
```

- [ ] **Step 13: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 14: Commit**

```bash
git add src/store/useFinanceStore.ts
git commit -m "feat: make all store mutations board-aware"
```

---

## Task 4: Create `useActiveBoardData` hook

**Files:**
- Create: `src/store/useActiveBoardData.ts`

- [ ] **Step 1: Create the file**

```typescript
import { useFinanceStore } from './useFinanceStore';
import type { MonthData, IncomeEntry, ExpenseEntry } from '../types';

interface ActiveBoardData {
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
}

export function useActiveBoardData(): ActiveBoardData {
  return useFinanceStore((s) => {
    if (s.activeBoardId === 'personal' || s.activeBoardId === 'overall') {
      return {
        months: s.months,
        recurringIncomes: s.recurringIncomes,
        recurringExpenses: s.recurringExpenses,
      };
    }
    const board = s.extraBoards.find((b) => b.id === s.activeBoardId);
    return {
      months: board?.months ?? {},
      recurringIncomes: board?.recurringIncomes ?? [],
      recurringExpenses: board?.recurringExpenses ?? [],
    };
  });
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/store/useActiveBoardData.ts
git commit -m "feat: add useActiveBoardData hook"
```

---

## Task 5: Update read-path components to use `useActiveBoardData`

**Files:**
- Modify: `src/components/month/MonthSummary.tsx`
- Modify: `src/components/month/IncomeTable.tsx`
- Modify: `src/components/month/ExpenseBudgetSection.tsx`
- Modify: `src/components/dashboard/AnnualSummary.tsx`
- Modify: `src/components/dashboard/ExpenseCategoryBarChart.tsx`

### MonthSummary.tsx

- [ ] **Step 1: Add import** at the top of `src/components/month/MonthSummary.tsx`:

```typescript
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 2: Replace the three `useFinanceStore` data reads** inside `MonthSummary`:

Replace:
```typescript
const monthData = useFinanceStore((s) => s.months[monthIndex]);
const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
```

With:
```typescript
const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
const monthData = months[monthIndex];
```

### IncomeTable.tsx

- [ ] **Step 3: Add import** at the top of `src/components/month/IncomeTable.tsx`:

```typescript
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 4: Replace the two data reads** inside `IncomeTable`:

Replace:
```typescript
const monthData = useFinanceStore((s) => s.months[monthIndex]);
const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
```

With:
```typescript
const { months, recurringIncomes } = useActiveBoardData();
const monthData = months[monthIndex];
```

### ExpenseBudgetSection.tsx

- [ ] **Step 5: Add import** at the top of `src/components/month/ExpenseBudgetSection.tsx`:

```typescript
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 6: Replace the two data reads** inside `ExpenseBudgetSection`:

Replace:
```typescript
const monthData = useFinanceStore((s) => s.months[monthIndex]);
const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
```

With:
```typescript
const { months, recurringExpenses } = useActiveBoardData();
const monthData = months[monthIndex];
```

### AnnualSummary.tsx

- [ ] **Step 7: Add import** at the top of `src/components/dashboard/AnnualSummary.tsx`:

```typescript
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 8: Replace the three data reads** inside `AnnualSummary`:

Replace:
```typescript
const months = useFinanceStore((s) => s.months);
const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
```

With:
```typescript
const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
```

Keep `const year = useFinanceStore((s) => s.settings.year);` unchanged.

### ExpenseCategoryBarChart.tsx

- [ ] **Step 9: Add import** at the top of `src/components/dashboard/ExpenseCategoryBarChart.tsx`:

```typescript
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 10: Replace the two data reads** inside `ExpenseCategoryBarChart`:

Replace:
```typescript
const months = useFinanceStore((s) => s.months);
const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
```

With:
```typescript
const { months, recurringExpenses } = useActiveBoardData();
```

- [ ] **Step 11: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 12: Commit**

```bash
git add src/components/month/MonthSummary.tsx src/components/month/IncomeTable.tsx src/components/month/ExpenseBudgetSection.tsx src/components/dashboard/AnnualSummary.tsx src/components/dashboard/ExpenseCategoryBarChart.tsx
git commit -m "feat: update read-path components to use useActiveBoardData"
```

---

## Task 6: Update `MonthDashboard` CSV export to use active board data

**Files:**
- Modify: `src/components/dashboard/MonthDashboard.tsx`

The `exportMonthCSV` function currently reads `useFinanceStore.getState()` directly. Update it to accept board-specific data as parameters.

- [ ] **Step 1: Add type imports** at the top of `MonthDashboard.tsx` (add to existing imports):

```typescript
import type { MonthData, IncomeEntry, ExpenseEntry } from '../../types';
import { useActiveBoardData } from '../../store/useActiveBoardData';
```

- [ ] **Step 2: Update `exportMonthCSV` signature** — replace the function signature and its body's data access:

Replace the entire `exportMonthCSV` function with:

```typescript
function exportMonthCSV(
  monthIndex: number,
  boardMonths: Record<number, MonthData>,
  boardRecurringIncomes: IncomeEntry[],
  boardRecurringExpenses: ExpenseEntry[]
) {
  const state = useFinanceStore.getState();
  const md = boardMonths[monthIndex];
  const year = state.settings.year;
  const monthName = HEBREW_MONTHS[monthIndex];

  const allExpenses = [...boardRecurringExpenses, ...(md?.expenses ?? [])];
  const allIncome = [...boardRecurringIncomes, ...(md?.income ?? [])];

  const BOM = '﻿';
  const lines: string[] = [];

  lines.push(`ייצוא ${monthName} ${year}`);
  lines.push('');

  lines.push('--- הכנסות ---');
  lines.push('תאריך,מקור,בן משפחה,סכום,סוג');
  allIncome.forEach((e) => {
    const member = state.familyMembers.find((m) => m.id === e.memberId)?.name ?? '';
    lines.push(`${e.date},${e.source},${member},${e.amount},${e.isRecurring ? 'קבוע' : 'חד פעמי'}`);
  });
  lines.push(`,,סה"כ הכנסות,${sumAmounts(allIncome)},`);
  lines.push('');

  lines.push('--- הוצאות ---');
  lines.push('תאריך,קטגוריה,תת-קטגוריה,תיאור,סכום,אמצעי תשלום,סוג');
  allExpenses.forEach((e) => {
    const catName = CATEGORIES.find((c) => c.id === e.categoryId)?.nameHe ?? e.categoryId;
    const subCat = e.categoryId === 'other' && e.customCategory?.trim()
      ? e.customCategory.trim()
      : CATEGORIES.find((c) => c.id === e.categoryId)?.subcategories.find((s) => s.id === e.subcategoryId)?.nameHe ?? '';
    const pay = PAYMENT_METHODS.find((m) => m.id === e.paymentMethod)?.nameHe ?? e.paymentMethod;
    lines.push(`${e.date},${catName},${subCat},${e.description},${e.amount},${pay},${e.isRecurring ? 'קבוע' : 'חד פעמי'}`);
  });
  lines.push(`,,,סה"כ הוצאות,${sumAmounts(allExpenses)},,`);

  const csv = BOM + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_${monthName}_${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 3: Update the component body** — add hook call and pass data to the export call. Inside `MonthDashboard()`, add after `const year = ...`:

```typescript
const { months: boardMonths, recurringIncomes: boardRecurringIncomes, recurringExpenses: boardRecurringExpenses } = useActiveBoardData();
const activeBoardId = useFinanceStore((s) => s.activeBoardId);
```

- [ ] **Step 4: Update the export button's `onClick`** — find the button with `onClick={() => exportMonthCSV(monthIndex)}` and replace with:

```tsx
onClick={() => exportMonthCSV(monthIndex, boardMonths, boardRecurringIncomes, boardRecurringExpenses)}
```

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/MonthDashboard.tsx
git commit -m "feat: update MonthDashboard CSV export to use active board data"
```

---

## Task 7: Add boards section to Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Add store imports** at the top of `Sidebar.tsx`:

```typescript
import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
```

- [ ] **Step 2: Add icon components** — add these small SVG helpers after the existing icon components:

```tsx
function LayersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashSmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function PlusSmIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
```

- [ ] **Step 3: Add boards UI inside the `Sidebar` component** — inside the `Sidebar` function, add after the existing store reads and before the `return`:

```typescript
const activeBoardId = useFinanceStore((s) => s.activeBoardId);
const extraBoards = useFinanceStore((s) => s.extraBoards);
const setActiveBoard = useFinanceStore((s) => s.setActiveBoard);
const addBoard = useFinanceStore((s) => s.addBoard);
const renameBoard = useFinanceStore((s) => s.renameBoard);
const deleteBoard = useFinanceStore((s) => s.deleteBoard);

const [newBoardName, setNewBoardName] = useState('');
const [showAddBoard, setShowAddBoard] = useState(false);
const [renamingId, setRenamingId] = useState<string | null>(null);
const [renameValue, setRenameValue] = useState('');

const handleAddBoard = () => {
  const name = newBoardName.trim();
  if (!name) return;
  addBoard(name);
  setNewBoardName('');
  setShowAddBoard(false);
};

const startRename = (id: string, currentName: string) => {
  setRenamingId(id);
  setRenameValue(currentName);
};

const saveRename = () => {
  if (renamingId && renameValue.trim()) {
    renameBoard(renamingId, renameValue.trim());
  }
  setRenamingId(null);
};
```

- [ ] **Step 4: Add the boards section JSX** — inside the `<nav>` element, add the boards section BEFORE the `{NAV.map(...)}` block:

```tsx
{/* Boards section */}
<div className="mb-3">
  <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider px-3 mb-1">לוחות</p>

  {/* Overall board */}
  <button
    onClick={() => { setActiveBoard('overall'); onClose(); }}
    className={`${base} w-full text-right ${activeBoardId === 'overall' ? activeClass : inactiveClass}`}
  >
    <LayersIcon />
    כללי
  </button>

  {/* Personal board — always present, cannot be renamed/deleted */}
  <button
    onClick={() => { setActiveBoard('personal'); onClose(); }}
    className={`${base} w-full text-right ${activeBoardId === 'personal' ? activeClass : inactiveClass}`}
  >
    <CalendarIcon />
    אישי
  </button>

  {/* Extra boards */}
  {extraBoards.map((board) => (
    <div key={board.id} className="group relative">
      {renamingId === board.id ? (
        <div className="flex items-center gap-1 px-3 py-1.5">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setRenamingId(null); }}
            className="flex-1 border border-lavender-dark rounded px-2 py-0.5 text-sm focus:outline-none min-w-0"
            dir="rtl"
          />
          <button onClick={saveRename} className="text-[10px] text-white bg-lavender-dark px-1.5 py-0.5 rounded cursor-pointer">שמור</button>
        </div>
      ) : (
        <button
          onClick={() => { setActiveBoard(board.id); onClose(); }}
          className={`${base} w-full text-right pr-3 pl-14 ${activeBoardId === board.id ? activeClass : inactiveClass}`}
        >
          <CalendarIcon />
          {board.name}
        </button>
      )}
      {renamingId !== board.id && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); startRename(board.id, board.name); }}
            className="text-[#9090A8] hover:text-[#5B52A0] p-0.5 rounded cursor-pointer"
            title="שנה שם"
          >
            <PencilIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`למחוק את הלוח "${board.name}"? כל הנתונים יימחקו.`)) {
                if (activeBoardId === board.id) setActiveBoard('personal');
                deleteBoard(board.id);
              }
            }}
            className="text-[#9090A8] hover:text-red-500 p-0.5 rounded cursor-pointer"
            title="מחק לוח"
          >
            <TrashSmIcon />
          </button>
        </div>
      )}
    </div>
  ))}

  {/* Add board */}
  {showAddBoard ? (
    <div className="flex items-center gap-1 px-3 py-1.5">
      <input
        autoFocus
        value={newBoardName}
        onChange={(e) => setNewBoardName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAddBoard(); if (e.key === 'Escape') { setShowAddBoard(false); setNewBoardName(''); } }}
        placeholder="שם הלוח"
        className="flex-1 border border-lavender-dark rounded px-2 py-0.5 text-sm focus:outline-none min-w-0"
        dir="rtl"
      />
      <button onClick={handleAddBoard} className="text-[10px] text-white bg-lavender-dark px-1.5 py-0.5 rounded cursor-pointer">הוסף</button>
    </div>
  ) : (
    <button
      onClick={() => setShowAddBoard(true)}
      className={`${base} w-full text-right text-[#9090A8] hover:text-[#5B52A0] hover:bg-lavender-light text-xs`}
    >
      <PlusSmIcon />
      הוסף לוח
    </button>
  )}
</div>
```

- [ ] **Step 5: Remove the `NAV` array, its `map()` call, and the now-unused `NavLink` import** — the `NAV` array and `NavLink` are no longer needed; TypeScript strict mode will fail if they remain. Remove these three things:

1. The `import { NavLink } from 'react-router-dom';` line
2. The `const NAV = [...]` array
3. The `{NAV.map(({ to, label, icon, end }) => ( <NavLink ...> ))}` block in the JSX

`CalendarIcon` is still used in the boards section so keep the component definition.

- [ ] **Step 6: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: add boards section to sidebar"
```

---

## Task 8: Create `OverallDashboard` component

**Files:**
- Create: `src/components/dashboard/OverallDashboard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../shared/StatCard';

interface Props {
  monthIndex: number;
}

interface BoardSummary {
  id: string;
  name: string;
  income: number;
  expenses: number;
  net: number;
}

export default function OverallDashboard({ monthIndex }: Props) {
  const months = useFinanceStore((s) => s.months);
  const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
  const extraBoards = useFinanceStore((s) => s.extraBoards);

  const boards: BoardSummary[] = [
    {
      id: 'personal',
      name: 'אישי',
      income: sumAmounts(months[monthIndex]?.income ?? []) + sumAmounts(recurringIncomes),
      expenses: sumAmounts(months[monthIndex]?.expenses ?? []) + sumAmounts(recurringExpenses),
      net: 0,
    },
    ...extraBoards.map((b) => ({
      id: b.id,
      name: b.name,
      income: sumAmounts(b.months[monthIndex]?.income ?? []) + sumAmounts(b.recurringIncomes),
      expenses: sumAmounts(b.months[monthIndex]?.expenses ?? []) + sumAmounts(b.recurringExpenses),
      net: 0,
    })),
  ].map((b) => ({ ...b, net: b.income - b.expenses }));

  const totalIncome = boards.reduce((s, b) => s + b.income, 0);
  const totalExpenses = boards.reduce((s, b) => s + b.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  const incomeBreakdown = boards.map((b) => `${b.name} ${formatCurrency(b.income)}`).join(' + ');
  const expenseBreakdown = boards.map((b) => `${b.name} ${formatCurrency(b.expenses)}`).join(' + ');

  return (
    <div dir="rtl">
      {/* Combined summary cards */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            title='סה"כ הכנסות'
            value={formatCurrency(totalIncome)}
            colorClass="bg-sage-light"
            accentColor="#5A9A42"
            subtitle={boards.length > 1 ? incomeBreakdown : undefined}
          />
          <StatCard
            title='סה"כ הוצאות'
            value={formatCurrency(totalExpenses)}
            colorClass="bg-blush-light"
            accentColor="#9B72C0"
            subtitle={boards.length > 1 ? expenseBreakdown : undefined}
          />
          <StatCard
            title="יתרה"
            value={formatCurrency(totalNet)}
            colorClass={totalNet >= 0 ? 'bg-sage-light' : 'bg-blush-light'}
            accentColor={totalNet >= 0 ? '#5A9A42' : '#9B72C0'}
            subtitle={totalNet >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
          />
        </div>
      </div>

      {/* Per-board breakdown */}
      {boards.length > 1 && (
        <>
          <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-3">פירוט לפי לוח</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {boards.map((board) => (
              <div key={board.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-lavender-dark" />
                <div className="p-4">
                  <p className="text-sm font-semibold text-[#1E1E2E] mb-3">{board.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-sage-light rounded-lg p-2">
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">הכנסות</p>
                      <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(board.income)}</p>
                    </div>
                    <div className="bg-blush-light rounded-lg p-2">
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">הוצאות</p>
                      <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(board.expenses)}</p>
                    </div>
                    <div className={`${board.net >= 0 ? 'bg-sage-light' : 'bg-blush-light'} rounded-lg p-2`}>
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">יתרה</p>
                      <p className={`text-sm font-bold ${board.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(board.net)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {boards.length === 1 && (
        <p className="text-sm text-[#9090A8] text-center py-8">
          הוסף לוח נוסף (כמו &quot;עסקי&quot;) מהתפריט הצדדי כדי לראות פירוט כאן
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Confirm `StatCard` subtitle renders correctly** — `StatCard` already accepts `subtitle?: string` and renders it below the value. No changes needed to that component.

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/OverallDashboard.tsx
git commit -m "feat: add OverallDashboard read-only summary component"
```

---

## Task 9: Wire `MonthDashboard` to render `OverallDashboard` on overall board

**Files:**
- Modify: `src/components/dashboard/MonthDashboard.tsx`

- [ ] **Step 1: Add `OverallDashboard` import**:

```typescript
import OverallDashboard from './OverallDashboard';
```

- [ ] **Step 2: Replace the content below the month navigator** — in the JSX, replace everything below the month navigator card (the `<div className="bg-white rounded-2xl ...">` block) with a conditional:

```tsx
{activeBoardId === 'overall' ? (
  <OverallDashboard monthIndex={monthIndex} />
) : (
  <>
    {/* ── Summary Cards ── */}
    <MonthSummary monthIndex={monthIndex} />

    {/* ── Expenses ── */}
    <SectionDivider label="הוצאות" />
    <div className="mb-6">
      <ExpenseCategoryBarChart monthIndex={monthIndex} showToggle={false} />
    </div>
    <ExpenseBudgetSection monthIndex={monthIndex} />

    {/* ── Income ── */}
    <SectionDivider label="הכנסות" />
    <IncomeTable monthIndex={monthIndex} />

    {/* ── Annual Summary ── */}
    <SectionDivider label="סיכום שנתי" />
    <div className="mb-6">
      <AnnualSummary />
    </div>

    {/* ── Savings ── */}
    <SectionDivider label="חסכונות" />
    <SavingsPage />
  </>
)}
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/MonthDashboard.tsx
git commit -m "feat: branch MonthDashboard to OverallDashboard when overall board is active"
```

---

## Task 10: Final build verification and smoke test

- [ ] **Step 1: Full production build**

```bash
cd /Users/liorgabay/Downloads/FINANCE_ISRAEL && npm run build
```
Expected: no TypeScript errors, `✓ built in` message.

- [ ] **Step 2: Start dev server and manually verify**

```bash
npm run dev
```

Open `http://localhost:5173` and check:
1. Sidebar shows "כללי", "אישי" under "לוחות"
2. "אישי" is active by default — dashboard looks exactly as before
3. Click "+ הוסף לוח", type "עסקי", press Enter — new board appears in sidebar
4. Click "עסקי" — dashboard shows empty state
5. Add an expense on "עסקי" — it doesn't appear when switching back to "אישי"
6. Click "כללי" — OverallDashboard shows combined totals from both boards
7. Hover over "עסקי" in sidebar — pencil and trash icons appear
8. Rename "עסקי" to "עסק" — name updates
9. Delete a board — confirm dialog appears, board is removed
10. CSV export on "אישי" only exports personal board data

- [ ] **Step 3: Commit if any minor fixes were needed during smoke test**

```bash
git add -p
git commit -m "fix: address smoke test findings"
```
