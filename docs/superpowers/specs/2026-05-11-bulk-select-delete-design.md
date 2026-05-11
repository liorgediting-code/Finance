# Bulk Select & Delete for Expense and Income Tables

**Date:** 2026-05-11  
**Status:** Approved

## Overview

Add per-table bulk selection mode to the monthly dashboard's expense and income tables. Users can toggle into selection mode, check individual rows, and delete all selected entries at once. The existing "delete all" shortcut is preserved.

## Scope

Changes are self-contained to two files:
- `src/components/month/ExpenseTable.tsx`
- `src/components/month/IncomeTable.tsx`

No store, type, or routing changes required.

## UI Behavior

### Entering Selection Mode

Each table's header row gains a "בחר" button, positioned alongside the existing "מחק הכלל" button. Clicking "בחר" activates selection mode for that table only. The other table is unaffected.

### While in Selection Mode

- A checkbox column is prepended as the first column (rightmost, RTL layout).
- The table header row gains a "select all" checkbox. Checking it selects all visible rows; unchecking deselects all.
- The "מחק הכלל" button is hidden (replaced by the selection UI to avoid redundant destructive options).
- The "בחר" button changes to "ביטול" — clicking it exits selection mode and clears all selections.
- An action bar appears between the section title and the table: `נבחרו X פריטים` with a "מחק נבחרים" button. The button is disabled (grayed out) when 0 rows are selected.

### Deletion

Clicking "מחק נבחרים" shows a single `window.confirm`:
- Expenses: `למחוק X הוצאות נבחרות?`
- Incomes: `למחוק X הכנסות נבחרות?`

If the income selection includes recurring entries, the confirm message appends: `(הכנסות קבועות יוסרו מכל החודשים)`.

On confirmation, all selected entries are deleted using the existing per-entry delete store actions. After deletion, selection mode exits automatically.

### Income Table Specifics

The income table displays both `recurringIncomes` and monthly `income` entries in a single list. Both types are selectable. Deleting a recurring income entry calls `deleteRecurringIncome(id)`; deleting a monthly entry calls `deleteIncome(monthIndex, id)` — the same logic as the existing single-row delete.

## State

Each table manages its own selection state locally with `useState`:
- `selectionMode: boolean` — whether the table is in selection mode
- `selectedIds: Set<string>` — IDs of checked rows

No state is lifted to parent components.

## Non-Goals

- Cross-table selection (selecting expenses and incomes together) is out of scope.
- Keyboard shortcuts (Shift+click range select) are out of scope.
- The "delete all" button (`clearExpenses` / `clearIncome`) is preserved as-is outside selection mode.
