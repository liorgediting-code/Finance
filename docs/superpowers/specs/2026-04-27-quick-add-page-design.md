# Quick Add Page — Design Spec
Date: 2026-04-27

## Overview

A dedicated `/add` route that provides a focused, always-visible data-entry experience for the three core financial actions: adding an expense, income, or savings deposit. Entries sync immediately to all other tools via the existing Zustand store.

---

## Route & Component

- **Route:** `/add`
- **Component:** `src/components/add/QuickAddPage.tsx`
- **Nav placement:**
  - BottomNav (mobile): 5th center item — `+` circle button labeled **הוסף**, between "לוחות" and "כלים"
  - Sidebar (desktop): new "הוסף" link alongside existing items

---

## Page Layout

1. **Month selector** (top) — same chevron left/right navigator used in MonthDashboard; defaults to current month. Controls which `monthIndex` one-time entries are saved to. Recurring entries ignore this selector.

2. **Tab bar** — three tabs: **הוצאה | הכנסה | חסכון** (expenses first, most common action)

3. **Form area** — always-visible form for the active tab (no toggle to reveal)

4. **Submit button** — on success: green toast (2s) + form resets; stays on the same tab

---

## Forms

### הוצאה (Expense)
| Field | Notes |
|---|---|
| תאריך | defaults to today |
| קטגוריה + תת-קטגוריה | via existing `CategorySelect` component |
| תיאור | free text |
| סכום ₪ | number input |
| אמצעי תשלום | dropdown, existing `PAYMENT_METHODS` |
| הוצאה קבועה toggle | if on → saves to `recurringExpenses`; if off → saves to `months[monthIndex].expenses` |

### הכנסה (Income)
| Field | Notes |
|---|---|
| תאריך | defaults to today |
| מקור הכנסה | free text |
| בן משפחה | dropdown from `familyMembers` |
| סכום ₪ | number input |
| הערות | optional free text |
| הכנסה קבועה toggle | if on → saves to `recurringIncomes`; if off → saves to `months[monthIndex].income` |

### חסכון (Savings)
| Field | Notes |
|---|---|
| בחר קרן | dropdown of existing `savingsFunds`, plus "קרן חדשה" option |
| סכום להוסיף ₪ | adds to `savedAmount` of selected fund |
| **If "קרן חדשה":** | |
| שם הקרן | free text |
| יעד ₪ | target amount |
| צבע | color picker (existing `FUND_COLORS` palette) |

---

## Data Flow

All writes use existing Zustand store actions — no new store logic needed:

| Action | Store method |
|---|---|
| Add one-time expense | `addExpense(monthIndex, entry)` |
| Add recurring expense | `addRecurringExpense(entry)` |
| Add one-time income | `addIncome(monthIndex, entry)` |
| Add recurring income | `addRecurringIncome(entry)` |
| Deposit to savings fund | `updateSavingsFund(id, { savedAmount: fund.savedAmount + deposit })` |
| Create new savings fund | `addSavingsFund(fundData)` |

The store's existing debounced Supabase upsert handles persistence. Data added here immediately reflects in MonthDashboard, charts, AnnualSummary, CashflowPage, and all other tools.

---

## Validation

- Expense: category and amount > 0 required
- Income: source and amount > 0 required
- Savings deposit: fund selected (or new fund name filled) and amount > 0 required

Inline error message above the submit button on failed validation.

---

## Out of Scope

- Editing or deleting existing entries (handled in MonthDashboard)
- Bulk entry / CSV import (handled in CSVImporterPage)
