# Future Income / Expense Entries

**Date:** 2026-05-05  
**Status:** Approved

## Overview

Allow users to log an expected future income or expense directly in the monthly board. A future entry is visually distinct and excluded from running totals until its date arrives, at which point it automatically renders as a normal entry.

---

## Data Model

**File:** `src/types/index.ts`

Add one optional field to each entry type:

```ts
// IncomeEntry
isFuture?: boolean;

// ExpenseEntry
isFuture?: boolean;
```

The existing `date` field doubles as the expected date. No migration required — the field is optional and defaults to false/undefined.

---

## Calculation Logic

**File:** `src/utils/calculations.ts` (and any direct `sumAmounts` call sites)

Entries where `isFuture === true && date > today` are excluded from all totals. Once `date <= today`, the same entry is included automatically. This is pure render-time logic — no store action or background job needed.

Affected sites:
- `computeMonthTotals` utility
- `IncomeTable` total footer
- `MonthSummary` income/expense totals

---

## UI — Add Forms

Both `IncomeTable` and `ExpenseTable` add forms gain a **"עתידי"** toggle, placed below the recurring toggle (same visual style: pill switch + label with clock icon).

- When toggled **on**: the date field label changes to "תאריך צפוי" and defaults to `today + 7 days`.
- When toggled **off**: date field reverts to normal label and today's date.
- `isFuture` and `isRecurring` are mutually exclusive — toggling one disables the other.

---

## UI — Table Rows

Future entries (`isFuture === true && date > today`) render with:

- Row background: `bg-amber-50` (light yellow)
- A **"צפוי"** badge next to source/description: clock icon + Hebrew label, amber color
- Amount displayed in `text-amber-700` (muted amber, not the normal bold black)
- Edit and delete actions identical to normal rows

Once `date <= today`, the row renders exactly like a normal entry — no badge, normal colors, included in totals.

---

## UI — MonthSummary

Below the income total and below the expense total in `MonthSummary`, add a small sub-line when future entries exist for that month:

- Income section: `+ ₪X צפוי להתקבל` in amber
- Expense section: `+ ₪X צפוי לצאת` in amber

These sums only count entries that are still in the future (`date > today`). They are purely informational and do not affect the displayed totals or the remaining/savings calculation.

---

## Scope / Out of Scope

**In scope:**
- Future income entries (personal board)
- Future expense entries (personal board)
- Auto-promotion on render when date passes
- Summary sub-lines in MonthSummary

**Out of scope:**
- Notifications/reminders when a future entry's date arrives
- Extra board (board != 'personal') support — future entries follow the same board scoping as regular entries, but no special handling is added
- Recurring future entries
