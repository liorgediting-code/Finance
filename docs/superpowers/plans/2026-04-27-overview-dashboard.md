# Overview Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new full-screen overview dashboard at `/` that aggregates all 9 financial modules with a health score hero, KPI row, annual chart, and module cards — moving the existing MonthDashboard to `/month`.

**Architecture:** New `OverviewDashboard` page at `src/pages/OverviewDashboard.tsx` assembles 10 self-contained card components, each reading from `useFinanceStore` directly via `useShallow`. A pure utility function `src/utils/healthScore.ts` computes the 0–100 score. No existing pages are modified except route wiring and navigation.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Zustand with `useShallow`, Recharts, React Router v7, Heebo font. All Tailwind classes use the existing design tokens (`lavender`, `sage`, `blush`, `powder`, `almond`). No new dependencies.

---

## File Map

**Create:**
- `src/utils/healthScore.ts` — pure score computation, no React
- `src/components/overview/OverviewKPIRow.tsx` — 4 headline metric cards
- `src/components/overview/OverviewAnnualChart.tsx` — 12-month grouped bar chart (Recharts)
- `src/components/overview/OverviewSavingsCard.tsx` — savings funds + savings vehicles
- `src/components/overview/OverviewDebtCard.tsx` — mortgages + debts
- `src/components/overview/OverviewGoalsCard.tsx` — life goals with SVG donut rings
- `src/components/overview/OverviewInstallmentsCard.tsx` — installments summary
- `src/components/overview/OverviewSalaryCard.tsx` — recurring income summary (salary not persisted in store)
- `src/components/overview/OverviewChagCard.tsx` — nearest upcoming chag budget
- `src/components/overview/OverviewCashflowCard.tsx` — cashflow projection summary
- `src/components/overview/HealthScoreHero.tsx` — gradient banner with score + breakdown bars
- `src/pages/OverviewDashboard.tsx` — page shell assembling all cards

**Modify:**
- `src/App.tsx` — `/` → OverviewDashboard; add `/month` → MonthDashboard
- `src/components/layout/Sidebar.tsx` — add "מבט-על" nav link at top
- `src/components/layout/BottomNav.tsx` — personal tab highlights on `/`, boards navigate to `/month`
- `src/components/dashboard/MonthDashboard.tsx` — add "← מבט-על" back link at top

---

## Task 1: Health Score Utility

**Files:**
- Create: `src/utils/healthScore.ts`

- [ ] **Step 1: Create `src/utils/healthScore.ts`**

```typescript
import type { SavingsFund, Mortgage, Debt, LifeGoal, MonthData, IncomeEntry, ExpenseEntry } from '../types';

export interface HealthBreakdown {
  savingsRate: number;       // 0-30
  debtRatio: number;         // 0-25
  goalsProgress: number;     // 0-20
  budgetAdherence: number;   // 0-15
  savingsFundProgress: number; // 0-10
}

export interface HealthScoreResult {
  score: number;
  breakdown: HealthBreakdown;
  savingsRatePct: number;
  debtRatioLabel: string;
  goalsAvgPct: number;
  positiveMonths: number;
  savingsFundAvgPct: number;
}

interface ScoreInput {
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
  mortgages: Mortgage[];
  debts: Debt[];
  lifeGoals: LifeGoal[];
  savingsFunds: SavingsFund[];
}

export function computeHealthScore(input: ScoreInput): HealthScoreResult {
  const {
    months, recurringIncomes, recurringExpenses,
    mortgages, debts, lifeGoals, savingsFunds,
  } = input;

  // Monthly income/expense helpers
  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const currentMonth = new Date().getMonth();
  const currentMonthData = months[currentMonth];
  const monthlyIncome = recurringIncome + (currentMonthData?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = recurringExpense + (currentMonthData?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthlyIncome - monthlyExpense;

  // 1. Savings rate (0-30): net/income * 100, scaled to 30
  const savingsRatePct = monthlyIncome > 0 ? (net / monthlyIncome) * 100 : 0;
  const savingsRate = Math.min(30, Math.max(0, (savingsRatePct / 30) * 30));

  // 2. Debt-to-income ratio (0-25): lower monthly debt payments = better
  const totalMonthlyDebt = [
    ...mortgages.flatMap((m) => m.tracks.map((t) => t.monthlyPayment)),
    ...debts.map((d) => d.minimumPayment),
  ].reduce((s, v) => s + v, 0);
  const debtRatioPct = monthlyIncome > 0 ? (totalMonthlyDebt / monthlyIncome) * 100 : 0;
  const debtRatioLabel = debtRatioPct < 20 ? 'נמוך' : debtRatioPct < 35 ? 'מתון' : 'גבוה';
  const debtRatio = Math.max(0, 25 - (debtRatioPct / 100) * 50);

  // 3. Goals progress (0-20): average % of all goals
  const goalsAvgPct = lifeGoals.length > 0
    ? lifeGoals.reduce((s, g) => s + (g.targetAmount > 0 ? Math.min(100, (g.savedAmount / g.targetAmount) * 100) : 0), 0) / lifeGoals.length
    : 0;
  const goalsProgress = (goalsAvgPct / 100) * 20;

  // 4. Budget adherence (0-15): fraction of year's months where income > expenses
  const positiveMonths = Object.values(months).filter((md) => {
    const inc = recurringIncome + md.income.reduce((s, e) => s + e.amount, 0);
    const exp = recurringExpense + md.expenses.reduce((s, e) => s + e.amount, 0);
    return inc > exp;
  }).length;
  const totalTrackedMonths = Math.max(1, Object.keys(months).length);
  const budgetAdherence = (positiveMonths / totalTrackedMonths) * 15;

  // 5. Savings fund progress (0-10): average saved/target across all funds
  const savingsFundAvgPct = savingsFunds.length > 0
    ? savingsFunds.reduce((s, f) => s + (f.targetAmount > 0 ? Math.min(100, (f.savedAmount / f.targetAmount) * 100) : 0), 0) / savingsFunds.length
    : 0;
  const savingsFundProgress = (savingsFundAvgPct / 100) * 10;

  const breakdown: HealthBreakdown = {
    savingsRate: Math.round(savingsRate * 10) / 10,
    debtRatio: Math.round(debtRatio * 10) / 10,
    goalsProgress: Math.round(goalsProgress * 10) / 10,
    budgetAdherence: Math.round(budgetAdherence * 10) / 10,
    savingsFundProgress: Math.round(savingsFundProgress * 10) / 10,
  };

  const score = Math.round(
    breakdown.savingsRate + breakdown.debtRatio + breakdown.goalsProgress +
    breakdown.budgetAdherence + breakdown.savingsFundProgress
  );

  return {
    score,
    breakdown,
    savingsRatePct: Math.round(savingsRatePct),
    debtRatioLabel,
    goalsAvgPct: Math.round(goalsAvgPct),
    positiveMonths,
    savingsFundAvgPct: Math.round(savingsFundAvgPct),
  };
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: no TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/utils/healthScore.ts
git commit -m "feat: add health score computation utility"
```

---

## Task 2: OverviewKPIRow

**Files:**
- Create: `src/components/overview/OverviewKPIRow.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewKPIRow.tsx`**

```tsx
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

function KPICard({
  label, value, sub, valueClass,
}: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1">
      <span className="text-xs text-[#9090A8]">{label}</span>
      <span className={`text-lg font-bold ${valueClass}`}>{value}</span>
      <span className="text-[11px] text-[#9090A8]">{sub}</span>
    </div>
  );
}

export default function OverviewKPIRow() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { mortgages, debts } = useFinanceStore(
    useShallow((s) => ({ mortgages: s.mortgages, debts: s.debts }))
  );

  const currentMonth = new Date().getMonth();
  const md = months[currentMonth];

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyIncome = recurringIncome + (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = recurringExpense + (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round((net / monthlyIncome) * 100) : 0;

  const totalDebt =
    mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0) +
    debts.reduce((s, d) => s + d.balance, 0);

  // 3-month average for trend
  const prevMonths = [1, 2, 3].map((offset) => {
    const idx = ((currentMonth - offset) + 12) % 12;
    const prev = months[idx];
    return recurringIncome + (prev?.income ?? []).reduce((s, e) => s + e.amount, 0);
  });
  const avgIncome = prevMonths.reduce((s, v) => s + v, 0) / 3;
  const incomeTrend = avgIncome > 0 ? Math.round(((monthlyIncome - avgIncome) / avgIncome) * 100) : 0;

  const prevExpenses = [1, 2, 3].map((offset) => {
    const idx = ((currentMonth - offset) + 12) % 12;
    const prev = months[idx];
    return recurringExpense + (prev?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  });
  const avgExpense = prevExpenses.reduce((s, v) => s + v, 0) / 3;
  const expenseTrend = avgExpense > 0 ? Math.round(((monthlyExpense - avgExpense) / avgExpense) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPICard
        label="הכנסה החודש"
        value={formatCurrency(monthlyIncome)}
        sub={incomeTrend >= 0 ? `↑ ${incomeTrend}% מהממוצע` : `↓ ${Math.abs(incomeTrend)}% מהממוצע`}
        valueClass="text-sage-dark"
      />
      <KPICard
        label="הוצאות החודש"
        value={formatCurrency(monthlyExpense)}
        sub={expenseTrend <= 0 ? `↓ ${Math.abs(expenseTrend)}% מהממוצע` : `↑ ${expenseTrend}% מהממוצע`}
        valueClass="text-blush-dark"
      />
      <KPICard
        label="חיסכון נטו"
        value={formatCurrency(net)}
        sub={`${savingsRate}% משיעור הכנסה`}
        valueClass={net >= 0 ? 'text-powder-dark' : 'text-blush-dark'}
      />
      <KPICard
        label="סך חובות"
        value={formatCurrency(totalDebt)}
        sub="משכנתה + הלוואות"
        valueClass="text-almond-dark"
      />
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/OverviewKPIRow.tsx
git commit -m "feat: add OverviewKPIRow component"
```

---

## Task 3: OverviewAnnualChart

**Files:**
- Create: `src/components/overview/OverviewAnnualChart.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewAnnualChart.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_LABELS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-3 text-sm text-right" dir="rtl">
      <p className="font-semibold text-[#1E1E2E] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#4A4A60]">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function OverviewAnnualChart() {
  const navigate = useNavigate();
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);

  const data = MONTH_LABELS.map((label, i) => {
    const md = months[i];
    const income = recurringIncomes.reduce((s, e) => s + e.amount, 0) +
      (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
    const expense = recurringExpenses.reduce((s, e) => s + e.amount, 0) +
      (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    return { label, הכנסות: income, הוצאות: expense, חיסכון: Math.max(0, income - expense) };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-[#1E1E2E]">סיכום שנתי {year}</span>
        <button
          onClick={() => navigate('/month')}
          className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors cursor-pointer"
        >
          ← חודש נוכחי
        </button>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%" barGap={2}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9090A8' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8, direction: 'rtl' }}
            formatter={(value) => <span className="text-[#4A4A60]">{value}</span>}
          />
          <Bar dataKey="הכנסות" fill="#8DBF78" radius={[3, 3, 0, 0]} />
          <Bar dataKey="הוצאות" fill="#D8C0E8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="חיסכון" fill="#7EB8E0" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/OverviewAnnualChart.tsx
git commit -m "feat: add OverviewAnnualChart component"
```

---

## Task 4: OverviewSavingsCard

**Files:**
- Create: `src/components/overview/OverviewSavingsCard.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewSavingsCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsVehicleType } from '../../types';

const VEHICLE_NAMES: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'קרן השתלמות',
  pension: 'פנסיה',
  kupat_gemel: 'קופ״ג',
  child_savings: 'חסכון ילדים',
};

export default function OverviewSavingsCard() {
  const { savingsFunds, savingsVehicles } = useFinanceStore(
    useShallow((s) => ({ savingsFunds: s.savingsFunds, savingsVehicles: s.savingsVehicles }))
  );

  const vehicleTotals = savingsVehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.type] = (acc[v.type] ?? 0) + v.balance;
    return acc;
  }, {});

  const totalSaved = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
  const totalTarget = savingsFunds.reduce((s, f) => s + f.targetAmount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🏦 חיסכון וכלי חיסכון</span>
        <NavLink to="/savings-vehicles" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {savingsFunds.length > 0 ? (
        <div className="flex flex-col gap-2">
          {savingsFunds.slice(0, 3).map((fund) => {
            const pct = fund.targetAmount > 0 ? Math.min(100, (fund.savedAmount / fund.targetAmount) * 100) : 0;
            return (
              <div key={fund.id}>
                <div className="flex justify-between text-xs text-[#4A4A60] mb-1">
                  <span>{fund.name}</span>
                  <span className="text-[#9090A8]">{formatCurrency(fund.savedAmount)} / {formatCurrency(fund.targetAmount)}</span>
                </div>
                <div className="h-1.5 bg-sage-light rounded-full">
                  <div className="h-1.5 bg-sage rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {savingsFunds.length > 3 && (
            <span className="text-xs text-[#9090A8]">+{savingsFunds.length - 3} קרנות נוספות — {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#9090A8]">אין קרנות חיסכון</p>
      )}

      {Object.keys(vehicleTotals).length > 0 && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="flex flex-col gap-1.5">
            {(Object.entries(vehicleTotals) as [SavingsVehicleType, number][]).map(([type, total]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-[#6B6B8A]">{VEHICLE_NAMES[type]}</span>
                <span className="font-semibold text-powder-dark">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/OverviewSavingsCard.tsx
git commit -m "feat: add OverviewSavingsCard component"
```

---

## Task 5: OverviewDebtCard

**Files:**
- Create: `src/components/overview/OverviewDebtCard.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewDebtCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewDebtCard() {
  const { mortgages, debts } = useFinanceStore(
    useShallow((s) => ({ mortgages: s.mortgages, debts: s.debts }))
  );

  const mortgageBalance = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0);
  const mortgagePayment = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.monthlyPayment, 0);
  const debtBalance = debts.reduce((s, d) => s + d.balance, 0);
  const debtPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const totalBalance = mortgageBalance + debtBalance;
  const totalPayment = mortgagePayment + debtPayment;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💳 חובות ומשכנתה</span>
        <NavLink to="/debt-planner" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {mortgages.length > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#4A4A60] mb-1">
            <span>משכנתה</span>
            <span className="font-semibold text-blush-dark">{formatCurrency(mortgageBalance)}</span>
          </div>
          {mortgages[0].tracks.map((track) => {
            const originalBalance = track.balance + (track.monthlyPayment * track.remainingMonths);
            const pctPaid = originalBalance > 0 ? Math.min(100, ((originalBalance - track.balance) / originalBalance) * 100) : 0;
            return (
              <div key={track.id} className="h-1.5 bg-blush-light rounded-full mb-1">
                <div className="h-1.5 bg-blush-dark rounded-full" style={{ width: `${pctPaid}%` }} />
              </div>
            );
          })}
        </div>
      )}

      {debts.slice(0, 3).map((debt) => (
        <div key={debt.id} className="flex justify-between text-xs">
          <span className="text-[#6B6B8A]">{debt.name}</span>
          <span className="font-semibold text-almond-dark">{formatCurrency(debt.balance)}</span>
        </div>
      ))}

      {(mortgages.length > 0 || debts.length > 0) && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#9090A8]">סה״כ חוב</span>
              <span className="font-bold text-blush-dark">{formatCurrency(totalBalance)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9090A8]">תשלום חודשי</span>
              <span className="font-semibold text-[#4A4A60]">{formatCurrency(totalPayment)}</span>
            </div>
          </div>
        </>
      )}

      {mortgages.length === 0 && debts.length === 0 && (
        <p className="text-xs text-[#9090A8]">אין חובות רשומים</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/OverviewDebtCard.tsx
git commit -m "feat: add OverviewDebtCard component"
```

---

## Task 6: OverviewGoalsCard

**Files:**
- Create: `src/components/overview/OverviewGoalsCard.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewGoalsCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';

const CIRCUMFERENCE = 2 * Math.PI * 15.9;

function GoalRing({ emoji, name, pct }: { emoji: string; name: string; pct: number }) {
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="44" height="44" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r="15.9" fill="none" stroke="#EDE4F5" strokeWidth="4" />
        <circle
          cx="19" cy="19" r="15.9" fill="none"
          stroke="#9B72C0" strokeWidth="4"
          strokeDasharray={`${CIRCUMFERENCE}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 19 19)"
        />
        <text x="19" y="22" textAnchor="middle" fontSize="7" fill="#4A4A60" fontWeight="700">
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="text-[10px] text-[#6B6B8A] text-center leading-tight max-w-[44px]">
        {emoji} {name}
      </span>
    </div>
  );
}

export default function OverviewGoalsCard() {
  const lifeGoals = useFinanceStore(useShallow((s) => s.lifeGoals));

  const visible = lifeGoals.slice(0, 6);
  const overflow = lifeGoals.length - visible.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🎯 יעדי חיים</span>
        <NavLink to="/life-goals" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {visible.length > 0 ? (
        <div className="flex flex-wrap gap-3 justify-start">
          {visible.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
            return <GoalRing key={goal.id} emoji={goal.emoji} name={goal.name} pct={pct} />;
          })}
          {overflow > 0 && (
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs text-[#9090A8]">+{overflow}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#9090A8]">אין יעדים מוגדרים</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/OverviewGoalsCard.tsx
git commit -m "feat: add OverviewGoalsCard component"
```

---

## Task 7: Four Small Module Cards

**Files:**
- Create: `src/components/overview/OverviewInstallmentsCard.tsx`
- Create: `src/components/overview/OverviewSalaryCard.tsx`
- Create: `src/components/overview/OverviewChagCard.tsx`
- Create: `src/components/overview/OverviewCashflowCard.tsx`

- [ ] **Step 1: Create `src/components/overview/OverviewInstallmentsCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewInstallmentsCard() {
  const installments = useFinanceStore(useShallow((s) => s.installments));

  const now = new Date();
  const currentLinear = now.getFullYear() * 12 + now.getMonth();

  const active = installments.filter((inst) => {
    const start = inst.startYear * 12 + inst.startMonth - 1;
    const end = start + inst.numPayments - 1;
    return currentLinear >= start && currentLinear <= end;
  });

  const monthlyTotal = active.reduce((s, inst) => s + inst.totalAmount / inst.numPayments, 0);
  const totalRemaining = active.reduce((inst_s, inst) => {
    const start = inst.startYear * 12 + inst.startMonth - 1;
    const elapsed = currentLinear - start;
    const remaining = inst.numPayments - elapsed - 1;
    return inst_s + (remaining * inst.totalAmount / inst.numPayments);
  }, 0);

  const nextToFinish = active.sort((a, b) => {
    const endA = a.startYear * 12 + a.startMonth - 1 + a.numPayments;
    const endB = b.startYear * 12 + b.startMonth - 1 + b.numPayments;
    return endA - endB;
  })[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">📦 תשלומים</span>
        <NavLink to="/installments" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">פעילים</span><span className="font-semibold">{active.length}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">תשלום חודשי</span><span className="font-semibold">{formatCurrency(monthlyTotal)}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">סה״כ נותר</span><span className="font-semibold text-blush-dark">{formatCurrency(totalRemaining)}</span></div>
      {nextToFinish && (
        <>
          <div className="h-px bg-gray-100" />
          <p className="text-[11px] text-[#9090A8]">הבא לסיום: {nextToFinish.description}</p>
        </>
      )}
      {active.length === 0 && <p className="text-xs text-[#9090A8]">אין תשלומים פעילים</p>}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/overview/OverviewSalaryCard.tsx`**

Note: Salary slip data is not persisted in the Zustand store. This card shows recurring income as a proxy.

```tsx
import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewSalaryCard() {
  const { recurringIncomes } = useActiveBoardData();

  const totalRecurring = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const count = recurringIncomes.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💼 הכנסות קבועות</span>
        <NavLink to="/salary-slip" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← תלוש</NavLink>
      </div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">מקורות</span><span className="font-semibold">{count}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">סה״כ חודשי</span><span className="font-semibold text-sage-dark">{formatCurrency(totalRecurring)}</span></div>
      <div className="h-1.5 bg-sage-light rounded-full mt-1">
        <div className="h-1.5 bg-sage rounded-full" style={{ width: count > 0 ? '100%' : '0%' }} />
      </div>
      <p className="text-[10px] text-[#9090A8]">לניתוח תלוש מפורט ← תלוש שכר</p>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/overview/OverviewChagCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewChagCard() {
  const { chagBudgets, year } = useFinanceStore(
    useShallow((s) => ({ chagBudgets: s.chagBudgets, year: s.settings.year }))
  );

  const currentYear = chagBudgets.filter((c) => c.year === year);
  const nearest = currentYear[0];

  if (!nearest) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1E1E2E]">🕍 תקציב חג</span>
          <NavLink to="/chag-budget" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
        </div>
        <p className="text-xs text-[#9090A8]">אין תקציב חג לשנה זו</p>
      </div>
    );
  }

  const totalBudget = nearest.items.reduce((s, i) => s + i.budget, 0);
  const totalSpent = nearest.items.reduce((s, i) => s + i.spent, 0);
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🕍 תקציב חג</span>
        <NavLink to="/chag-budget" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <p className="text-xs font-semibold text-[#4A4A60]">{nearest.chagName} {nearest.year}</p>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">תקציב</span><span className="font-semibold">{formatCurrency(totalBudget)}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">הוצא</span><span className="font-semibold text-almond-dark">{formatCurrency(totalSpent)}</span></div>
      <div className="h-1.5 bg-almond-light rounded-full">
        <div className="h-1.5 bg-almond rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-[#9090A8]">נותר: {formatCurrency(remaining)}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/overview/OverviewCashflowCard.tsx`**

```tsx
import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewCashflowCard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const monthlyNets = Object.values(months).map((md) => {
    const inc = recurringIncome + md.income.reduce((s, e) => s + e.amount, 0);
    const exp = recurringExpense + md.expenses.reduce((s, e) => s + e.amount, 0);
    return inc - exp;
  });

  const positiveCount = monthlyNets.filter((n) => n > 0).length;
  const avgNet = monthlyNets.length > 0 ? monthlyNets.reduce((s, v) => s + v, 0) / monthlyNets.length : 0;
  const worstMonth = monthlyNets.length > 0 ? Math.min(...monthlyNets) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💸 תזרים</span>
        <NavLink to="/cashflow" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">ממוצע חודשי</span>
        <span className={`font-semibold ${avgNet >= 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>{formatCurrency(avgNet)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">גרוע ביותר</span>
        <span className={`font-semibold ${worstMonth >= 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>{formatCurrency(worstMonth)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">חודשים חיוביים</span>
        <span className="font-semibold">{positiveCount}/{monthlyNets.length}</span>
      </div>
      {monthlyNets.length === 0 && <p className="text-[11px] text-[#9090A8]">אין נתוני חודשים עדיין</p>}
    </div>
  );
}
```

- [ ] **Step 5: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/overview/OverviewInstallmentsCard.tsx src/components/overview/OverviewSalaryCard.tsx src/components/overview/OverviewChagCard.tsx src/components/overview/OverviewCashflowCard.tsx
git commit -m "feat: add four small module overview cards"
```

---

## Task 8: HealthScoreHero

**Files:**
- Create: `src/components/overview/HealthScoreHero.tsx`

- [ ] **Step 1: Create `src/components/overview/HealthScoreHero.tsx`**

```tsx
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { computeHealthScore } from '../../utils/healthScore';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function ScoreBar({ label, value, max, displayValue }: { label: string; value: number; max: number; displayValue: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#4A4A60] w-32 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/30 rounded-full">
        <div className="h-1.5 bg-white/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#4A4A60] w-10 text-left flex-shrink-0">{displayValue}</span>
    </div>
  );
}

export default function HealthScoreHero() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { mortgages, debts, lifeGoals, savingsFunds } = useFinanceStore(
    useShallow((s) => ({
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsFunds: s.savingsFunds,
    }))
  );

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();

  const result = computeHealthScore({ months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds });

  const scoreColor = result.score >= 70 ? 'text-sage-dark' : result.score >= 40 ? 'text-almond-dark' : 'text-blush-dark';

  return (
    <div className="rounded-2xl shadow-sm p-5 bg-gradient-to-l from-sage-light via-powder-light to-blush-light flex flex-col md:flex-row items-start md:items-center gap-4">
      {/* Score circle */}
      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/70 flex flex-col items-center justify-center shadow-sm">
        <span className={`text-2xl font-black ${scoreColor}`}>{result.score}</span>
        <span className="text-[10px] text-[#6B6B8A]">מתוך 100</span>
      </div>

      {/* Score bars */}
      <div className="flex-1 flex flex-col gap-2 w-full">
        <ScoreBar label="שיעור חיסכון" value={result.breakdown.savingsRate} max={30} displayValue={`${result.savingsRatePct}%`} />
        <ScoreBar label="יחס חוב/הכנסה" value={result.breakdown.debtRatio} max={25} displayValue={result.debtRatioLabel} />
        <ScoreBar label="התקדמות יעדים" value={result.breakdown.goalsProgress} max={20} displayValue={`${result.goalsAvgPct}%`} />
        <ScoreBar label="עמידה בתקציב" value={result.breakdown.budgetAdherence} max={15} displayValue={`${result.positiveMonths}/${Object.keys(months).length || 0}`} />
      </div>

      {/* Title */}
      <div className="flex-shrink-0 text-right">
        <h2 className="text-base font-bold text-[#1E1E2E]">בריאות פיננסית</h2>
        <p className="text-xs text-[#6B6B8A]">{currentMonthName} {year}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/overview/HealthScoreHero.tsx
git commit -m "feat: add HealthScoreHero component"
```

---

## Task 9: OverviewDashboard Page

**Files:**
- Create: `src/pages/OverviewDashboard.tsx`

- [ ] **Step 1: Create `src/pages/OverviewDashboard.tsx`**

```tsx
import HealthScoreHero from '../components/overview/HealthScoreHero';
import OverviewKPIRow from '../components/overview/OverviewKPIRow';
import OverviewAnnualChart from '../components/overview/OverviewAnnualChart';
import OverviewSavingsCard from '../components/overview/OverviewSavingsCard';
import OverviewDebtCard from '../components/overview/OverviewDebtCard';
import OverviewGoalsCard from '../components/overview/OverviewGoalsCard';
import OverviewInstallmentsCard from '../components/overview/OverviewInstallmentsCard';
import OverviewSalaryCard from '../components/overview/OverviewSalaryCard';
import OverviewChagCard from '../components/overview/OverviewChagCard';
import OverviewCashflowCard from '../components/overview/OverviewCashflowCard';

export default function OverviewDashboard() {
  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto" dir="rtl">
      <HealthScoreHero />
      <OverviewKPIRow />
      <OverviewAnnualChart />

      {/* Middle row: 3 equal columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OverviewSavingsCard />
        <OverviewDebtCard />
        <OverviewGoalsCard />
      </div>

      {/* Bottom row: 4 equal columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <OverviewInstallmentsCard />
        <OverviewSalaryCard />
        <OverviewChagCard />
        <OverviewCashflowCard />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/pages/OverviewDashboard.tsx
git commit -m "feat: add OverviewDashboard page component"
```

---

## Task 10: Route Changes

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update `src/App.tsx`** — add OverviewDashboard import and swap routes

Replace the current App.tsx content with:

```tsx
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import OverviewDashboard from './pages/OverviewDashboard'
import MonthDashboard from './components/dashboard/MonthDashboard'
import SettingsPage from './components/settings/SettingsPage'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './components/auth/LoginPage'
import SignupPage from './components/auth/SignupPage'
import AdminPage from './components/admin/AdminPage'
import TransactionSearchPage from './components/search/TransactionSearchPage'
import InstallmentsPage from './components/modules/InstallmentsPage'
import MortgagePage from './components/modules/MortgagePage'
import SavingsVehiclesPage from './components/modules/SavingsVehiclesPage'
import DebtPlannerPage from './components/modules/DebtPlannerPage'
import LifeGoalsPage from './components/modules/LifeGoalsPage'
import ChagBudgetPage from './components/modules/ChagBudgetPage'
import ChagimPlannerPage from './components/modules/ChagimPlannerPage'
import ActivityFeedPage from './components/modules/ActivityFeedPage'
import CashflowPage from './components/modules/CashflowPage'
import SalarySlipPage from './components/modules/SalarySlipPage'
import CSVImporterPage from './components/modules/CSVImporterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/*" element={
        <AuthGuard>
          <AppShell>
            <Routes>
              <Route path="/" element={<OverviewDashboard />} />
              <Route path="/month" element={<MonthDashboard />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/search" element={<TransactionSearchPage />} />
              <Route path="/installments" element={<InstallmentsPage />} />
              <Route path="/mortgage" element={<MortgagePage />} />
              <Route path="/savings-vehicles" element={<SavingsVehiclesPage />} />
              <Route path="/debt-planner" element={<DebtPlannerPage />} />
              <Route path="/life-goals" element={<LifeGoalsPage />} />
              <Route path="/chag-budget" element={<ChagBudgetPage />} />
              <Route path="/annual-planner" element={<ChagimPlannerPage />} />
              <Route path="/activity" element={<ActivityFeedPage />} />
              <Route path="/cashflow" element={<CashflowPage />} />
              <Route path="/salary-slip" element={<SalarySlipPage />} />
              <Route path="/csv-import" element={<CSVImporterPage />} />
            </Routes>
          </AppShell>
        </AuthGuard>
      } />
    </Routes>
  )
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: route / to OverviewDashboard, add /month for MonthDashboard"
```

---

## Task 11: Navigation Updates

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/components/dashboard/MonthDashboard.tsx`

- [ ] **Step 1: Add "מבט-על" link to Sidebar**

In `src/components/layout/Sidebar.tsx`, find the `{/* Boards section */}` comment and insert a new nav link **before** it (after the `<nav>` opening and the empty `<div className="mb-3">`):

Locate this block:
```tsx
        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {/* Boards section */}
```

Replace with:
```tsx
        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4 overflow-y-auto">
          {/* Overview */}
          <div className="mb-3">
            <NavLink to="/" end className={navLinkClass} onClick={onClose}>
              <BarChartIcon />
              מבט-על
            </NavLink>
            <NavLink to="/month" className={navLinkClass} onClick={onClose}>
              <CalendarIcon />
              לוח חודשי
            </NavLink>
          </div>

          {/* Boards section */}
```

- [ ] **Step 2: Update BottomNav personal tab to navigate to `/month`**

In `src/components/layout/BottomNav.tsx`, find the Personal tab NavLink:

```tsx
          {/* Personal tab */}
          <NavLink
            to="/"
            end
            onClick={() => setActiveBoard('personal')}
            className={base}
          >
```

Replace with:
```tsx
          {/* Personal tab */}
          <NavLink
            to="/month"
            onClick={() => setActiveBoard('personal')}
            className={base}
          >
```

Also update the tab label from `אישי` to `חודשי` in the two places it appears inside this NavLink's render function:
```tsx
                  <span
                    className={active ? 'font-semibold' : ''}
                    style={{ color: active ? PERSONAL_COLOR : '#9090A8' }}
                  >
                    חודשי
                  </span>
```

And update the active detection condition — `isActive` for `/month` route doesn't need `end` so just use `isActive`:
```tsx
              const active = isActive && !onNonPersonalBoard && !showBoards;
```
(no change needed — `isActive` will be true when on `/month`)

Also update `BoardsSheet.selectBoard` to navigate to `/month` instead of `/`:

Find:
```tsx
  const selectBoard = (id: string) => {
    setActiveBoard(id);
    navigate('/');
    onClose();
  };
```

Replace with:
```tsx
  const selectBoard = (id: string) => {
    setActiveBoard(id);
    navigate('/month');
    onClose();
  };
```

- [ ] **Step 3: Add back-link to MonthDashboard**

In `src/components/dashboard/MonthDashboard.tsx`, find the return statement of the `MonthDashboard` default export function. Add a back-link at the very top of the returned JSX, before the month navigator:

Find the opening of the MonthDashboard render (look for `return (` in the export default function and the first `<div` after it). Add this as the first child:

```tsx
      {/* Back to overview */}
      <div className="mb-3 flex justify-end">
        <NavLink to="/" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors flex items-center gap-1 cursor-pointer">
          מבט-על ←
        </NavLink>
      </div>
```

Also add the import for NavLink at the top of the file if not already present:
```tsx
import { NavLink } from 'react-router-dom';
```

- [ ] **Step 4: Build check**

Run: `npm run build`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Sidebar.tsx src/components/layout/BottomNav.tsx src/components/dashboard/MonthDashboard.tsx
git commit -m "feat: update navigation for overview dashboard home"
```

---

## Task 12: Smoke Test & Final Build

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: exit 0, no TypeScript errors, no unused variable errors

- [ ] **Step 2: Start dev server and manually verify**

Run: `npm run dev`

Check the following:
1. Navigate to `http://localhost:5173/` — OverviewDashboard renders with health score hero, 4 KPI cards, annual chart, 3 middle cards, 4 bottom cards
2. Click "← חודש נוכחי" in the annual chart — navigates to `/month`
3. On `/month`, click "מבט-על ←" — returns to `/`
4. Sidebar shows "מבט-על" and "לוח חודשי" links at the top — both navigate correctly
5. Mobile bottom nav "חודשי" tab navigates to `/month`
6. All "← פרטים" links in cards navigate to correct module pages
7. Cards with no data (e.g., no life goals) show empty state messages, not errors

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete overview dashboard — health score, KPI row, annual chart, 9 module cards"
```
