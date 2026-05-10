# Investment Forecast & Compound Interest Calculator — Design Spec
Date: 2026-05-11

## Overview

Add investment forecasting and a standalone compound interest calculator to the existing "חסכונות ופנסיה" (SavingsVehiclesPage). The page gains two tabs: "ניהול" (existing management UI) and "צפי" (new forecast tab).

---

## 1. Data Model

**Change:** Add `annualRate?: number` to the `SavingsVehicle` interface in `src/types/index.ts`.

```ts
export interface SavingsVehicle {
  // ... existing fields ...
  annualRate?: number; // annual return rate %, e.g. 6.5
}
```

Persisted automatically via the existing `updateSavingsVehicle` store action (no schema migration needed — JSON blob storage).

---

## 2. Tab Navigation

`SavingsVehiclesPage` gains a tab bar at the top:
- **"ניהול"** — existing UI, unchanged except for the new `annualRate` field in `VehicleForm`
- **"צפי"** — new forecast tab

Tab state is local React state (`useState`), not a route change.

---

## 3. "ניהול" Tab Changes

`VehicleForm` gains one new field:

| Label | Field | Type | Default |
|---|---|---|---|
| תשואה שנתית (%) | `annualRate` | number input | 0 |

Placed after the "הפקדת מעסיק" field. Accepts decimals (e.g. 6.5).

---

## 4. "צפי" Tab Layout

### 4a. Global Years Slider
- Range: 1–40 years, step 1, default 10
- Label: "צפי ל-X שנים"
- Drives all forecast cards unless overridden per-card

### 4b. Per-Investment Forecast Card
One card per `SavingsVehicle`, ordered by type (same as current page).

**Card contents:**
1. Header row: name, type badge, current balance, monthly deposits (employee + employer)
2. "שנים לצפי" input — number field, placeholder = global years. When filled, overrides the global slider for this card only.
3. **Line chart** (Recharts `LineChart`) — X axis = years (0..N), Y axis = balance in ₪
   - Line 1: with compound interest — colored per vehicle type
   - Line 2: without interest (deposits only) — gray dashed
   - Tooltip shows both values at each year
4. **Annual table** below the chart:
   - Columns: שנה | יתרה פתיחה | הפקדות שנתיות | ריבית שנצברה | יתרה סגירה
   - Rows: 1..N years
   - Table is scrollable if N > 10

**Forecast math (per year `t`):**
```
monthlyDeposit = employeeMonthlyDeposit + employerMonthlyDeposit
r = annualRate / 100 / 12
balance[0] = vehicle.balance
For each month: balance = balance * (1 + r) + monthlyDeposit
```
Computed once per card, memoized with `useMemo`.

If `annualRate` is 0 or undefined, the interest line equals the deposits-only line (no second line shown).

### 4c. Empty State
If no vehicles are defined, show a prompt: "הוסף השקעות בטאב ניהול כדי לראות צפי".

---

## 5. Compound Interest Calculator

Standalone card at the bottom of the "צפי" tab. No relation to existing investments.

### Inputs
| Label | Field | Default |
|---|---|---|
| קרן התחלתית (₪) | `principal` | 0 |
| הפקדה חודשית (₪) | `monthlyDeposit` | 1000 |
| ריבית שנתית (%) | `annualRate` | 6 |
| מספר שנים | `years` | 10 |

### KPI Row (3 cards)
- **סכום סופי** — final balance
- **סה"כ הופקד** — principal + (monthlyDeposit × 12 × years)
- **ריבית שנצברה** — finalBalance − totalDeposited (highlighted in green)

### Chart
`AreaChart` (Recharts) — X = years, two stacked areas:
- Bottom (blue): total deposited
- Top (green): interest earned on top

### Table
Year | יתרה | סה"כ הופקד | ריבית מצטברת

---

## 6. File Changes

| File | Change |
|---|---|
| `src/types/index.ts` | Add `annualRate?: number` to `SavingsVehicle` |
| `src/components/modules/SavingsVehiclesPage.tsx` | Tab nav, annualRate in form, forecast tab, compound calculator |

No new files, no new routes, no store changes beyond the type update.

---

## 7. Out of Scope

- Inflation adjustment
- Tax calculations (e.g. keren hishtalmut tax-exempt withdrawal modeling)
- Export / print view
- Saving the calculator state between sessions
