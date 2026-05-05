# Future Income / Expense Entries — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users log an expected future income or expense for a specific date; entries are visually distinct and excluded from running totals until their date arrives, at which point they automatically appear as normal entries.

**Architecture:** Add `isFuture?: boolean` to both `IncomeEntry` and `ExpenseEntry` types. Auto-promotion is pure render-time logic — `isEntryFuture(entry)` returns true only when `isFuture && date > today`, so no store mutations are needed when a date passes. Calculations exclude future entries; a new sub-line in MonthSummary shows the upcoming expected amounts.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS v4. No test framework.

---

## File Map

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `isFuture?: boolean` to `IncomeEntry` and `ExpenseEntry` |
| `src/utils/calculations.ts` | Add `isEntryFuture` helper |
| `src/utils/monthlyTotals.ts` | Filter future entries from `computeMonthTotals` |
| `src/components/month/MonthSummary.tsx` | Fix `confirmedTotal`, add future sub-lines in StatCards |
| `src/components/month/IncomeTable.tsx` | Add "עתידי" toggle, amber row styling, exclude future from footer total |
| `src/components/month/ExpenseBudgetSection.tsx` | Add "עתידי" toggle in `AddExpenseForm`, "צפוי" badge on rows, exclude future from category actuals |

---

## Task 1: Add `isFuture` to types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `isFuture` field to `IncomeEntry`**

In `src/types/index.ts`, update the `IncomeEntry` interface (currently lines 6–14):

```ts
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
```

- [ ] **Step 2: Add `isFuture` field to `ExpenseEntry`**

In `src/types/index.ts`, update the `ExpenseEntry` interface (currently lines 24–41). Add `isFuture` after the existing `isPending` line:

```ts
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
```

- [ ] **Step 3: Run build to verify no type errors**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build 2>&1 | tail -20
```

Expected: build succeeds (adding optional fields is backwards-compatible).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add isFuture flag to IncomeEntry and ExpenseEntry types"
```

---

## Task 2: Add `isEntryFuture` helper + update `computeMonthTotals`

**Files:**
- Modify: `src/utils/calculations.ts`
- Modify: `src/utils/monthlyTotals.ts`

- [ ] **Step 1: Add `isEntryFuture` to calculations.ts**

Append to `src/utils/calculations.ts`:

```ts
export function isEntryFuture(entry: { isFuture?: boolean; date: string }): boolean {
  return !!entry.isFuture && entry.date > new Date().toISOString().split('T')[0];
}
```

- [ ] **Step 2: Update `computeMonthTotals` to exclude future entries**

Replace the full content of `src/utils/monthlyTotals.ts` with:

```ts
import type { MonthData, IncomeEntry, ExpenseEntry } from '../types';
import { isEntryFuture } from './calculations';

export function computeMonthTotals(
  monthData: MonthData | undefined,
  recurringIncomes: IncomeEntry[],
  recurringExpenses: ExpenseEntry[],
): { totalIncome: number; totalExpenses: number; net: number } {
  const totalIncome =
    recurringIncomes.reduce((s, e) => s + e.amount, 0) +
    (monthData?.income ?? []).filter((e) => !isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  const totalExpenses =
    recurringExpenses.reduce((s, e) => s + e.amount, 0) +
    (monthData?.expenses ?? []).filter((e) => !isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}
```

Note: Recurring entries are never `isFuture` (the UI makes them mutually exclusive), so they are not filtered.

- [ ] **Step 3: Run build to verify no type errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/utils/calculations.ts src/utils/monthlyTotals.ts
git commit -m "feat: exclude future entries from computeMonthTotals and add isEntryFuture helper"
```

---

## Task 3: Update MonthSummary — fix `confirmedTotal` + add future sub-lines

**Files:**
- Modify: `src/components/month/MonthSummary.tsx`

- [ ] **Step 1: Import `isEntryFuture`**

Add `isEntryFuture` to the import in `src/components/month/MonthSummary.tsx` (currently line 2):

```ts
import { sumAmounts, isEntryFuture } from '../../utils/calculations';
```

- [ ] **Step 2: Compute future totals and fix `confirmedExpenses`**

In `MonthSummary`, after the line `const expenseEntries = monthData?.expenses ?? [];` (currently line 30), add:

```ts
const incomeEntries = monthData?.income ?? [];
const futureIncomeTotal = sumAmounts(incomeEntries.filter((e) => isEntryFuture(e)));
const futureExpenseTotal = sumAmounts(expenseEntries.filter((e) => isEntryFuture(e)));
```

Then update the `confirmedExpenses` line (currently line 38) to also exclude future entries:

```ts
const confirmedExpenses = expenseEntries.filter((e) => !e.isPending && !isEntryFuture(e));
```

- [ ] **Step 3: Add future sub-lines to StatCards**

Update the income StatCard's `subtitle` prop (currently passing `DeltaBadge` or `undefined`) to:

```tsx
subtitle={
  <>
    {futureIncomeTotal > 0 && (
      <span className="text-amber-600 block">+ {formatCurrency(futureIncomeTotal)} צפוי להתקבל</span>
    )}
    {prevIncome > 0 && <DeltaBadge current={totalIncome} previous={prevIncome} />}
  </>
}
```

Update the expense StatCard's `subtitle` prop:

```tsx
subtitle={
  <>
    {futureExpenseTotal > 0 && (
      <span className="text-amber-600 block">+ {formatCurrency(futureExpenseTotal)} צפוי לצאת</span>
    )}
    {prevExpenses > 0 && <DeltaBadge current={confirmedTotal} previous={prevExpenses} lowerIsBetter />}
  </>
}
```

- [ ] **Step 4: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/month/MonthSummary.tsx
git commit -m "feat: show future income/expense sub-lines in MonthSummary and exclude from confirmedTotal"
```

---

## Task 4: Update IncomeTable — add "עתידי" toggle + amber row styling

**Files:**
- Modify: `src/components/month/IncomeTable.tsx`

- [ ] **Step 1: Import `isEntryFuture`**

Add `isEntryFuture` to the import in `src/components/month/IncomeTable.tsx` (currently line 4):

```ts
import { sumAmounts, isEntryFuture } from '../../utils/calculations';
```

- [ ] **Step 2: Add `isFuture` to `FormData` and `emptyForm`**

Update the `FormData` interface (currently lines 14–21):

```ts
interface FormData {
  date: string;
  source: string;
  memberId: string;
  amount: number;
  notes: string;
  isRecurring: boolean;
  isFuture: boolean;
}
```

Update `emptyForm` (currently lines 23–30):

```ts
const emptyForm = (defaultMemberId: string): FormData => ({
  date: today(),
  source: '',
  memberId: defaultMemberId,
  amount: 0,
  notes: '',
  isRecurring: false,
  isFuture: false,
});
```

- [ ] **Step 3: Add a `sevenDaysLater` helper**

After the existing `const today = ...` line (line 12), add:

```ts
const sevenDaysLater = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};
```

- [ ] **Step 4: Add a `FutureIcon` component**

After the existing `RepeatIcon` component, add:

```tsx
function FutureIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
```

- [ ] **Step 5: Update `handleAdd` to pass `isFuture`**

The `handleAdd` function builds the entry to add. Update the `entry` assignment (currently `const entry = { ...newEntry, date: newEntry.date || today() }`):

```ts
const handleAdd = () => {
  const errs: string[] = [];
  if (!newEntry.source.trim()) errs.push('מקור הכנסה');
  if (newEntry.amount <= 0) errs.push('סכום');
  if (errs.length > 0) { setErrors(errs); return; }

  const entry = { ...newEntry, date: newEntry.date || today() };
  if (newEntry.isRecurring) {
    addRecurringIncome(entry);
  } else {
    addIncome(monthIndex, entry);
  }
  setNewEntry(emptyForm(defaultMemberId));
  setErrors([]);
  setShowForm(false);
};
```

(No change needed — `isFuture` is already spread in via `...newEntry`.)

- [ ] **Step 6: Add "עתידי" toggle to the add form**

In the add form JSX, after the closing `</label>` of the existing recurring toggle (around line 204), add:

```tsx
{/* Future toggle */}
<label className="flex items-center gap-2 mt-2 cursor-pointer w-fit" onClick={() => {
  const next = !newEntry.isFuture;
  setNewEntry({
    ...newEntry,
    isFuture: next,
    isRecurring: next ? false : newEntry.isRecurring,
    date: next ? sevenDaysLater() : today(),
  });
}}>
  <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${newEntry.isFuture ? 'bg-amber-500' : 'bg-gray-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${newEntry.isFuture ? 'translate-x-4' : 'translate-x-0'}`} />
  </div>
  <span className="text-sm text-[#4A4A60] flex items-center gap-1.5">
    <FutureIcon />
    הכנסה עתידית (צפויה בתאריך זה)
  </span>
</label>
```

Also update the existing recurring toggle's `onClick` to clear `isFuture` when recurring is toggled on:

```tsx
<label className="flex items-center gap-2 mt-3 cursor-pointer w-fit" onClick={() => {
  const next = !newEntry.isRecurring;
  setNewEntry({ ...newEntry, isRecurring: next, isFuture: next ? false : newEntry.isFuture });
}}>
```

- [ ] **Step 7: Also update date field label when `isFuture` is on**

In the add form date field, update the label text conditionally:

```tsx
<label className="text-xs font-medium text-[#6B6B8A] mb-1 block">
  {newEntry.isFuture ? 'תאריך צפוי' : 'תאריך'}
</label>
```

- [ ] **Step 8: Exclude future entries from footer total + show future sub-line**

In the footer `tfoot`, update to exclude future entries from the total and optionally show a sub-line. Find the footer currently at the bottom of the table, and replace:

```tsx
<tfoot>
  <tr className="bg-sage-light/50 font-semibold border-t border-gray-200">
    <td className="px-4 py-2.5 text-[#4A4A60] text-sm" colSpan={3}>סה&quot;כ הכנסות</td>
    <td className="px-4 py-2.5 text-[#1E1E2E] font-bold">{formatCurrency(totalIncome)}</td>
    <td className="px-4 py-2.5" colSpan={2} />
  </tr>
</tfoot>
```

With:

```tsx
<tfoot>
  <tr className="bg-sage-light/50 font-semibold border-t border-gray-200">
    <td className="px-4 py-2.5 text-[#4A4A60] text-sm" colSpan={3}>
      סה&quot;כ הכנסות
      {(() => {
        const futureSum = sumAmounts(allEntries.filter((e) => isEntryFuture(e)));
        return futureSum > 0 ? (
          <span className="text-[10px] font-normal text-amber-600 mr-2">+ {formatCurrency(futureSum)} צפוי</span>
        ) : null;
      })()}
    </td>
    <td className="px-4 py-2.5 text-[#1E1E2E] font-bold">
      {formatCurrency(sumAmounts(allEntries.filter((e) => !isEntryFuture(e))))}
    </td>
    <td className="px-4 py-2.5" colSpan={2} />
  </tr>
</tfoot>
```

- [ ] **Step 9: Apply amber row styling and "צפוי" badge for future entries**

In the table row rendering (`allEntries.map(...)`, find the non-edit view branch), update the `<tr>` className to include amber background for future entries:

```tsx
<tr key={entry.id} className={`border-b border-gray-50 transition-colors ${
  isEntryFuture(entry)
    ? 'bg-amber-50'
    : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
} hover:bg-lavender-light/30`}>
```

In the source cell, add the "צפוי" badge next to the existing recurring badge:

```tsx
<td className="px-4 py-2.5 font-medium text-[#1E1E2E]">
  <div className="flex items-center gap-2">
    {entry.source}
    {isRecurring && (
      <span className="inline-flex items-center gap-1 bg-sage-light text-[#5A7A4A] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
        <RepeatIcon />
        קבוע
      </span>
    )}
    {isEntryFuture(entry) && (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
        <FutureIcon />
        צפוי
      </span>
    )}
  </div>
</td>
```

Also apply amber text color to the amount cell for future entries:

```tsx
<td className={`px-4 py-2.5 font-semibold ${isEntryFuture(entry) ? 'text-amber-700' : 'text-[#1E1E2E]'}`}>
  {formatCurrency(entry.amount)}
</td>
```

- [ ] **Step 10: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/components/month/IncomeTable.tsx
git commit -m "feat: add future income toggle and amber row styling in IncomeTable"
```

---

## Task 5: Update ExpenseBudgetSection — "עתידי" toggle + row badge + category totals

**Files:**
- Modify: `src/components/month/ExpenseBudgetSection.tsx`

- [ ] **Step 1: Import `isEntryFuture`**

Add to the imports in `src/components/month/ExpenseBudgetSection.tsx`. Find the line that imports from `../../utils/formatters` and add a new import:

```ts
import { isEntryFuture } from '../../utils/calculations';
```

- [ ] **Step 2: Update `emptyForm` to include `isFuture: false`**

Update the `emptyForm` function (currently lines 27–38):

```ts
const emptyForm = (): Omit<ExpenseEntry, 'id'> => ({
  date: today(),
  categoryId: '',
  subcategoryId: '',
  customCategory: '',
  description: '',
  amount: 0,
  paymentMethod: 'credit',
  notes: '',
  cancelUrl: '',
  isPending: false,
  isFuture: false,
});
```

- [ ] **Step 3: Add `sevenDaysLater` helper**

After the existing `const today = ...` line near the top of the file, add:

```ts
const sevenDaysLater = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};
```

- [ ] **Step 4: Add `isFuture` state to `AddExpenseForm`**

Inside `AddExpenseForm`, after the existing `const [isRecurring, setIsRecurring] = useState(...)` line (currently line 153), add:

```ts
const [isFuture, setIsFuture] = useState(false);
```

- [ ] **Step 5: Update `handleSubmit` to include `isFuture`**

In `AddExpenseForm`'s `handleSubmit`, update the call that adds the expense:

```ts
if (isRecurring) {
  addRecurringExpense({ ...submitForm, isFuture: false });
} else {
  addExpense(monthIndex, { ...submitForm, isFuture });
}
```

- [ ] **Step 6: Add "עתידי" toggle to `AddExpenseForm`'s toggle section**

In `AddExpenseForm`, find the toggles `<div className="flex flex-wrap gap-4 mt-3">` (currently lines 279–298). After the closing `</label>` of the pending toggle, add:

```tsx
<label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => {
  const next = !isFuture;
  setIsFuture(next);
  if (next) {
    setIsRecurring(false);
    setForm((f) => ({ ...f, isPending: false, date: sevenDaysLater() }));
  }
}}>
  <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isFuture ? 'bg-amber-500' : 'bg-gray-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isFuture ? 'translate-x-4' : 'translate-x-0'}`} />
  </div>
  <span className="text-sm text-[#4A4A60] flex items-center gap-1.5">
    <ClockIcon />
    הוצאה עתידית (צפויה בתאריך זה)
  </span>
</label>
```

Also update the recurring toggle's `onClick` to clear `isFuture`:

```tsx
<label className="flex items-center gap-2 cursor-pointer w-fit" onClick={() => {
  const next = !isRecurring;
  setIsRecurring(next);
  if (next) setIsFuture(false);
}}>
```

And update the date field label in `AddExpenseForm` to be conditional:

```tsx
<label className="text-xs font-medium text-[#6B6B8A] mb-1 block">
  {isFuture ? 'תאריך צפוי' : 'תאריך'}
</label>
```

- [ ] **Step 7: Update `startEdit` to capture `isFuture`**

In `ExpenseBudgetSection`, update the `startEdit` function (currently lines 447–463):

```ts
const startEdit = (entry: ExpenseEntry) => {
  setEditingId(entry.id);
  setEditIsRecurring(!!entry.isRecurring);
  setEditForm({
    date: entry.date,
    categoryId: entry.categoryId,
    subcategoryId: entry.subcategoryId,
    customCategory: entry.customCategory ?? '',
    description: entry.description,
    amount: entry.amount,
    paymentMethod: entry.paymentMethod,
    notes: entry.notes,
    cancelUrl: entry.cancelUrl ?? '',
    memberId: entry.memberId,
    isPending: entry.isPending,
    isFuture: entry.isFuture,
  });
};
```

- [ ] **Step 8: Update `rows` computation to add future bucket**

In `ExpenseBudgetSection`, find the `rows` map (starting around line 498). Add a `future` variable and update `confirmed`/`pending` to exclude future entries. Also track `totalFuture`. The full updated block:

```ts
let totalActual = 0;
let totalPending = 0;
let totalFuture = 0;

const rows = CATEGORIES.map((cat) => {
  const catExpenses = filteredExpenses.filter((e) => e.categoryId === cat.id);
  const confirmed = catExpenses.filter((e) => !e.isPending && !isEntryFuture(e));
  const actual = confirmed.reduce((s, e) => s + e.amount, 0);
  const pending = catExpenses.filter((e) => e.isPending && !isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  const future = catExpenses.filter((e) => isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  const budgetAmt = (budget[cat.id] ?? 0) + getRolledBudget(monthIndex, cat.id);
  const overBudget = budgetAmt > 0 && actual > budgetAmt;
  const pct = budgetAmt > 0 ? Math.min(100, Math.round((actual / budgetAmt) * 100)) : 0;
  const nearBudget = budgetAmt > 0 && pct >= 80 && pct < 100;
  totalActual += actual;
  totalPending += pending;
  totalFuture += future;
  return { cat, catExpenses, actual, pending, future, budgetAmt, overBudget, pct, nearBudget };
});

const visibleRows = rows.filter((r) => r.actual > 0 || r.pending > 0 || r.future > 0);
```

- [ ] **Step 9: Show future amount in category rows**

In the category row JSX (inside the `visibleRows.map(...)`, destructure `future` from the row object), and in the amount column, add the future sub-line below the existing budget display:

```tsx
{future > 0 && (
  <span className="text-[10px] font-normal text-amber-600 block">+ {formatCurrency(future)} צפוי</span>
)}
```

Place this after the existing `{budgetAmt > 0 && (...progress bar...)}` block, still inside the amount `<div className="text-right text-sm">`.

Also add a clock icon indicator to the category row button (similar to the existing pending clock indicator):

```tsx
{future > 0 && (
  <span className="inline-flex items-center gap-0.5 text-amber-500 text-[10px]">
    <ClockIcon />
  </span>
)}
```

Place this after the existing `{pending > 0 && (...)}` indicator.

- [ ] **Step 10: Add "צפוי" badge to future expense rows in the expanded transaction list**

In the expanded rows' description cell (inside the `catExpenses.map(...)` non-edit branch), find where the `entry.isPending` badge is rendered (around line 801). After it, add:

```tsx
{isEntryFuture(entry) && (
  <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
    <ClockIcon />
    צפוי
  </span>
)}
```

Also apply amber row background for future entries. Find the `<tr>` className in the non-edit branch (currently line 784):

```tsx
<tr className={`border-b border-gray-100 transition-colors ${
  isEntryFuture(entry) ? 'bg-amber-50/60' : entry.isPending ? 'bg-amber-50/60' : 'hover:bg-white'
}`}>
```

Also apply amber text to the amount cell for future entries:

```tsx
<td className={`px-3 py-2 font-semibold ${isEntryFuture(entry) ? 'text-amber-700' : 'text-[#1E1E2E]'}`}>
  {formatCurrency(entry.amount)}
</td>
```

- [ ] **Step 11: Update the totals footer to show future sub-line**

Find the totals footer div (around line 923):

```tsx
<div className="grid grid-cols-[1fr_120px_40px] bg-lavender-light/50 font-bold text-sm px-4 py-3 border-t border-gray-200">
  <span className="text-[#1E1E2E]">
    סה&quot;כ
    {totalPending > 0 && (
      <span className="text-[10px] font-normal text-amber-600 mr-2">+ {formatCurrency(totalPending)} ממתין</span>
    )}
    {totalFuture > 0 && (
      <span className="text-[10px] font-normal text-amber-600 mr-2">+ {formatCurrency(totalFuture)} צפוי לצאת</span>
    )}
  </span>
  <span className="text-right text-[#1E1E2E]">{formatCurrency(totalActual)}</span>
  <span />
</div>
```

- [ ] **Step 12: Run build**

```bash
npm run build 2>&1 | tail -20
```

Expected: build succeeds with no type errors.

- [ ] **Step 13: Commit**

```bash
git add src/components/month/ExpenseBudgetSection.tsx
git commit -m "feat: add future expense toggle, badge, and category totals in ExpenseBudgetSection"
```

---

## Task 6: Manual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify future income flow**

1. Open any month page
2. Click "הוסף הכנסה"
3. Toggle "הכנסה עתידית" → confirm date changes to today+7 and label shows "תאריך צפוי"
4. Verify recurring toggle turns off
5. Set amount ₪5,000 and save
6. Confirm the row shows with amber background and "צפוי" badge
7. Confirm MonthSummary income total does NOT include the ₪5,000
8. Confirm a sub-line "+ ₪5,000 צפוי להתקבל" appears in the income StatCard

- [ ] **Step 3: Verify auto-promotion**

1. Edit the future income entry and set the date to yesterday
2. Save — the row should now render without amber styling and without the "צפוי" badge
3. The MonthSummary income total should now include the amount

- [ ] **Step 4: Verify future expense flow**

1. Click "הוסף הוצאה"
2. Toggle "הוצאה עתידית" → confirm date changes to today+7
3. Confirm recurring and pending toggles turn off
4. Add a ₪1,000 future expense in any category
5. Confirm the category row shows the future amount separately as "+ ₪1,000 צפוי"
6. Confirm the totals footer shows "+ ₪1,000 צפוי לצאת"
7. Confirm MonthSummary expense total does NOT include it

- [ ] **Step 5: Final build**

```bash
npm run build 2>&1 | tail -5
```

Expected: exits 0.
