# Overview Dashboard — Design Spec
**Date:** 2026-04-27  
**Status:** Approved

---

## Summary

A new full-screen overview dashboard that replaces `/` as the app's home. It aggregates data from all 9 feature modules into one scrollable page. The current MonthDashboard moves to `/month`. A sidebar/bottom-nav link labeled "מבט-על" points to `/`.

---

## Architecture

**Approach:** New `OverviewDashboard` page component (`src/pages/OverviewDashboard.tsx`) with small self-contained card components, one per module section. Each card reads from `useFinanceStore` directly via `useShallow`. No changes to existing pages.

**New files:**
```
src/pages/OverviewDashboard.tsx           — page shell, layout grid
src/components/overview/HealthScoreHero.tsx
src/components/overview/OverviewKPIRow.tsx
src/components/overview/OverviewAnnualChart.tsx
src/components/overview/OverviewSavingsCard.tsx
src/components/overview/OverviewDebtCard.tsx
src/components/overview/OverviewGoalsCard.tsx
src/components/overview/OverviewInstallmentsCard.tsx
src/components/overview/OverviewSalaryCard.tsx
src/components/overview/OverviewChagCard.tsx
src/components/overview/OverviewCashflowCard.tsx
src/utils/healthScore.ts                  — pure score computation
```

**Route changes** (`src/App.tsx`):
- `/` → `OverviewDashboard`
- `/month` → `MonthDashboard` (new route, was `/`)

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  HealthScoreHero  (full width, gradient banner)     │
├─────────────────────────────────────────────────────┤
│  KPI · Income │ KPI · Expenses │ KPI · Net │ Debt   │
├─────────────────────────────────────────────────────┤
│  Annual 12-month bar chart  (full width)            │
├─────────────────────────────────────────────────────┤
│  Savings & Vehicles │ Debts & Mortgage │ Life Goals  │
├───────────────┬─────────────┬────────────┬──────────┤
│ Installments  │   Salary    │    Chag    │ Cashflow  │
└───────────────┴─────────────┴────────────┴──────────┘
```

Mobile (< md): single column, cards stack vertically.

---

## Design System

Use **existing** Tailwind classes and CSS theme tokens only — no new colors:

| Use | Token / Class |
|-----|--------------|
| Positive / income | `text-sage-dark`, `bg-sage-light` |
| Expenses / negative | `text-blush-dark`, `bg-blush-light` |
| Savings | `text-powder-dark`, `bg-powder-light` |
| Neutral / debt | `text-almond-dark`, `bg-almond-light` |
| Page background | `bg-[#F2F3F7]` |
| Card background | `bg-white` |
| Card shadow | `shadow-sm` |
| Card radius | `rounded-2xl` |
| Font | `font-['Heebo']` (inherited) |

All cards follow the pattern used in MonthDashboard: white `rounded-2xl shadow-sm p-4` with a small header row (`text-sm font-semibold`) and a right-aligned `→` link.

---

## Section Specs

### 1. HealthScoreHero
- Gradient banner: `from-sage-light via-powder-light to-blush-light`
- Large score circle (0–100) center-right
- 4 horizontal progress bars: שיעור חיסכון, יחס חוב/הכנסה, התקדמות יעדים, עמידה בתקציב
- Delta badge: score change vs. previous month
- Score formula (see `healthScore.ts` below)

### 2. KPIRow
4 cards in a responsive grid (`grid-cols-2 md:grid-cols-4`):
- **הכנסה החודש** — current month total income (recurring + monthly)
- **הוצאות החודש** — current month total expenses
- **חיסכון נטו** — income − expenses, savings rate %
- **סך חובות** — sum of all mortgage balances + debts

Each card shows a ±% trend vs. the 3-month average.

### 3. OverviewAnnualChart
- Recharts `BarChart` — three grouped bars per month: income (sage), expenses (blush), net savings (powder)
- Uses the existing `IncomeExpenseChart` color palette
- RTL x-axis with Hebrew month abbreviations
- Clicking a month bar navigates to `/month` with that month selected

### 4. OverviewSavingsCard
- Each `savingsFunds` item: name, progress bar (saved/target), amount
- Divider line
- Total `savingsVehicles` balances grouped by type: פנסיה, קרן השתלמות, קופ"ג, חסכון ילדים
- Link → `/savings-vehicles`

### 5. OverviewDebtCard
- Mortgage: total balance, monthly payment, % paid progress bar
- Each debt in `debts`: name, remaining balance, type icon
- Footer: total debt + total monthly payment
- Link → `/debt-planner` and `/mortgage`

### 6. OverviewGoalsCard
- SVG donut ring per `lifeGoals` entry (emoji + name + %)
- Up to 6 goals shown, overflow hidden with "+N more"
- Link → `/life-goals`

### 7. OverviewInstallmentsCard
- Count of active installments
- Total monthly cost
- Total remaining
- Next-to-finish item
- Link → `/installments`

### 8. OverviewSalaryCard
- Gross / deductions / net from latest `salarySlip` entry
- Gross→net progress bar
- Link → `/salary-slip`

### 9. OverviewChagCard
- Nearest upcoming chag budget (by date)
- Budget vs. spent progress bar + remaining amount
- Link → `/chag-budget`

### 10. OverviewCashflowCard
- Monthly average cashflow
- Worst month
- Count of positive months this year
- Link → `/cashflow`

---

## Health Score Formula (`src/utils/healthScore.ts`)

Pure function: `computeHealthScore(storeState): { score: number; breakdown: HealthBreakdown }`

| Component | Weight | Calculation |
|-----------|--------|-------------|
| שיעור חיסכון | 30 | `(net / income) * 100` clamped 0–30 |
| יחס חוב/הכנסה | 25 | `max(0, 25 - (monthlyDebtPayments / monthlyIncome) * 50)` |
| התקדמות יעדים | 20 | average % across all life goals × 0.2 |
| עמידה בתקציב | 15 | months where expenses < income this year / 12 × 15 |
| חסכונות בנוגע ליעד | 10 | average savingsFund (saved/target) × 10 |

Score is rounded to nearest integer (0–100).

---

## Navigation Changes

- **Sidebar**: add "מבט-על 🏠" as the first item, pointing to `/`
- **Bottom nav** (mobile): replace the current home icon route with `/overview` → `/` overview
- **MonthDashboard**: add a small breadcrumb/back link "← מבט-על" at the top

---

## What Does NOT Change

- MonthDashboard component internals — untouched
- All existing page components — untouched
- Store — no new state, overview cards are read-only computed views
- Design tokens, Tailwind config, index.css — untouched
