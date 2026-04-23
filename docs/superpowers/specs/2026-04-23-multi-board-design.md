# Multi-Board Feature Design
**Date:** 2026-04-23  
**Project:** FINANCE_ISRAEL

## Summary

Add support for multiple financial boards (e.g. "Personal" and "Business") so the user can separate their finances while still viewing a combined overall summary. Existing data and UI layout remain completely untouched.

---

## Constraints

- **No layout or visual design changes** to any existing screen. All changes are purely additive.
- The existing monthly dashboard, sidebar, settings, savings, and admin pages look and behave identically when on the "Personal" board.
- No routing changes — board switching is in-memory state, not URL-based.

---

## Data Model

### New type (`src/types/index.ts`)

```typescript
export interface Board {
  id: string;
  name: string;
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
}
```

### `CloudData` additions (`src/store/useFinanceStore.ts`)

```typescript
extraBoards: Board[];   // additional boards beyond the implicit "personal" board
```

The existing `months`, `recurringIncomes`, and `recurringExpenses` fields in `CloudData` are the **permanent "Personal" board**. They are never moved or renamed.

### Non-synced store state

```typescript
activeBoardId: string;  // 'personal' | 'overall' | board.id — resets to 'personal' on load
```

### Data isolation

| Data | Scope |
|------|-------|
| `months` | Per-board |
| `recurringIncomes` | Per-board |
| `recurringExpenses` | Per-board |
| `savingsFunds` | Shared (all boards) |
| `familyMembers` | Shared (all boards) |
| `settings` | Shared (all boards) |

### Migration

On `loadFromCloud`: if `data.extraBoards` is `undefined`, default to `[]`. No data transformation required — existing data stays in place as the personal board.

---

## Store Changes

### New state
- `activeBoardId: string` — non-cloud, defaults to `'personal'`

### New actions
- `setActiveBoard(id: string)` — sets `activeBoardId`
- `addBoard(name: string)` — appends a new `Board` with empty months/recurring to `extraBoards`, triggers sync
- `renameBoard(id: string, name: string)` — updates board name in `extraBoards`, triggers sync
- `deleteBoard(id: string)` — removes board from `extraBoards`, triggers sync

### Modified actions
All existing mutation actions (`addExpense`, `updateExpense`, `deleteExpense`, `addIncome`, `updateIncome`, `deleteIncome`, `addRecurringExpense`, `deleteRecurringExpense`, `addRecurringIncome`, `deleteRecurringIncome`, `setBudget`) become board-aware:

- When `activeBoardId === 'personal'`: write to `s.months` / `s.recurringIncomes` / `s.recurringExpenses` (existing behavior, unchanged)
- When `activeBoardId === someId`: write to the matching entry in `s.extraBoards`
- When `activeBoardId === 'overall'`: all mutation actions are no-ops (overall board is read-only)

### New helper hook (`src/store/useActiveBoardData.ts`)

```typescript
export function useActiveBoardData() {
  return useFinanceStore(s => {
    if (s.activeBoardId === 'personal' || s.activeBoardId === 'overall') {
      return {
        months: s.months,
        recurringIncomes: s.recurringIncomes,
        recurringExpenses: s.recurringExpenses,
      };
    }
    const board = s.extraBoards.find(b => b.id === s.activeBoardId);
    return {
      months: board?.months ?? {},
      recurringIncomes: board?.recurringIncomes ?? [],
      recurringExpenses: board?.recurringExpenses ?? [],
    };
  });
}
```

---

## Sidebar Changes

A "Boards" section is added **above** the existing nav items. Everything else in the sidebar is unchanged.

```
┌─────────────────────┐
│  ניהול פיננסי       │  ← brand (unchanged)
│  משפחתי            │
├─────────────────────┤
│  לוחות             │  ← new section header
│  ○ כללי            │  ← overall board (read-only)
│  ● אישי            │  ← personal board (always first, active by default)
│  ○ עסקי            │  ← extra boards (user-created)
│  + הוסף לוח        │  ← inline add button
├─────────────────────┤
│  הגדרות            │  ← unchanged
│  פאנל ניהול        │  ← unchanged
│  [user card]        │  ← unchanged
└─────────────────────┘
```

**Board item behavior:**
- Clicking any board calls `setActiveBoard(id)` — closes sidebar on mobile
- Active board highlighted with the same lavender style as existing active nav links
- "אישי" (personal) board cannot be renamed or deleted
- Extra boards show rename (pencil) and delete (trash) icon buttons on hover
- "+ הוסף לוח" shows a small inline text input + confirm button to name the new board

---

## Overall Board View

When `activeBoardId === 'overall'`, `MonthDashboard` renders `OverallDashboard` instead of the normal content. The month navigator (arrows, dots, CSV export) stays exactly the same.

`OverallDashboard` (new component at `src/components/dashboard/OverallDashboard.tsx`):

1. **Summary cards** — combined totals across all boards for the selected month (total income, total expenses, net). Uses the existing `StatCard` component. Each card shows a sub-line with per-board breakdown (e.g. "אישי ₪18k + עסקי ₪6.5k").
2. **Income vs Expenses bar chart** — uses the existing `IncomeExpenseChart` with data aggregated across all boards.
3. **Per-board breakdown cards** — one compact read-only card per board (personal first, then extras) showing: board name, monthly income, monthly expenses, net balance.

No expense tables, income forms, recurring sections, savings, or annual summary are shown in the overall view.

---

## Component Read-Path Changes

Components that currently read `s.months`, `s.recurringIncomes`, or `s.recurringExpenses` directly from the store switch to reading from `useActiveBoardData()`. Each change is a one-line selector swap with no structural or visual change.

**Affected components:**
- `MonthDashboard.tsx` — months for CSV export
- `MonthSummary.tsx` — months for summary cards
- `ExpenseBudgetSection.tsx` / `ExpenseTable.tsx` — months for expense list
- `IncomeTable.tsx` — months for income list
- `AnnualSummary.tsx` — all months for annual chart
- `ExpenseCategoryBarChart.tsx` — months + recurring for chart data

**Not touched:**
- `SavingsPage.tsx` — reads `savingsFunds` (shared)
- `SettingsPage.tsx` — reads `familyMembers` (shared)
- `AdminPage.tsx` — no financial data
- All auth components

---

## New Files

| File | Purpose |
|------|---------|
| `src/store/useActiveBoardData.ts` | Hook returning active board's months/recurring |
| `src/components/dashboard/OverallDashboard.tsx` | Read-only overall summary view |

## Modified Files

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Board` interface |
| `src/store/useFinanceStore.ts` | Add `extraBoards`, `activeBoardId`, board actions, board-aware mutations |
| `src/components/layout/Sidebar.tsx` | Add boards section above nav |
| `src/components/dashboard/MonthDashboard.tsx` | Branch on `activeBoardId === 'overall'` |
| `src/components/dashboard/AnnualSummary.tsx` | Use `useActiveBoardData` |
| `src/components/dashboard/ExpenseCategoryBarChart.tsx` | Use `useActiveBoardData` |
| `src/components/month/MonthSummary.tsx` | Use `useActiveBoardData` |
| `src/components/month/ExpenseBudgetSection.tsx` | Use `useActiveBoardData` |
| `src/components/month/ExpenseTable.tsx` | Use `useActiveBoardData` |
| `src/components/month/IncomeTable.tsx` | Use `useActiveBoardData` |
