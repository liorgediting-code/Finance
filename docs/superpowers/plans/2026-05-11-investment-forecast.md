# Investment Forecast & Compound Interest Calculator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add investment forecasting (chart + table, per-vehicle and global years selector) and a standalone compound interest calculator to the "חסכונות ופנסיה" page via a two-tab layout.

**Architecture:** `SavingsVehiclesPage` gains a local tab state (`'manage' | 'forecast'`). The "ניהול" tab is the existing UI with a new `annualRate` field added to `VehicleForm`. The "צפי" tab renders a global years slider, one `ForecastCard` per vehicle (Recharts `LineChart` + annual table), and a standalone `CompoundCalculator` card (`AreaChart` + table). All state is component-local; persistence of `annualRate` flows through the existing `updateSavingsVehicle` store action.

**Tech Stack:** React 19, TypeScript, Recharts, Tailwind CSS v4, Zustand

---

## File Map

| File | Action |
|---|---|
| `src/types/index.ts` | Add `annualRate?: number` to `SavingsVehicle` |
| `src/components/modules/SavingsVehiclesPage.tsx` | Tab nav, annualRate in form, ForecastCard, CompoundCalculator |

---

## Task 1: Add `annualRate` to the `SavingsVehicle` type and form

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/modules/SavingsVehiclesPage.tsx`

- [ ] **Step 1: Add `annualRate` to the type**

In `src/types/index.ts`, find the `SavingsVehicle` interface and add the field after `notes`:

```ts
export interface SavingsVehicle {
  id: string;
  type: SavingsVehicleType;
  name: string;
  balance: number;
  employeeMonthlyDeposit: number;
  employerMonthlyDeposit: number;
  notes: string;
  lockDate?: string;
  childName?: string;
  annualRate?: number; // annual return %, e.g. 6.5
}
```

- [ ] **Step 2: Add `annualRate` to `emptyForm` in SavingsVehiclesPage**

In `src/components/modules/SavingsVehiclesPage.tsx`, find `emptyForm()` and add the field:

```ts
const emptyForm = (): Omit<SavingsVehicle, 'id'> => ({
  type: 'keren_hishtalmut',
  name: '',
  balance: 0,
  employeeMonthlyDeposit: 0,
  employerMonthlyDeposit: 0,
  notes: '',
  lockDate: '',
  childName: '',
  annualRate: 0,
});
```

- [ ] **Step 3: Add `annualRate` input field to `VehicleForm`**

In `VehicleForm`, add a new field after the employer deposit field (before the conditional `keren_hishtalmut` / `child_savings` blocks):

```tsx
<div>
  <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תשואה שנתית (%)</label>
  <input
    type="number"
    value={f.annualRate ?? 0}
    onChange={(e) => setF({ ...f, annualRate: Number(e.target.value) })}
    placeholder="0"
    min={0}
    max={30}
    step={0.1}
    className={INPUT_CLS}
  />
</div>
```

- [ ] **Step 4: Fix the edit-form initializer to include `annualRate`**

Find the inline `setEditForm({...})` call inside the vehicle card (the onClick for the edit button) and add `annualRate`:

```ts
setEditForm({
  type: vehicle.type,
  name: vehicle.name,
  balance: vehicle.balance,
  employeeMonthlyDeposit: vehicle.employeeMonthlyDeposit,
  employerMonthlyDeposit: vehicle.employerMonthlyDeposit,
  notes: vehicle.notes,
  lockDate: vehicle.lockDate,
  childName: vehicle.childName,
  annualRate: vehicle.annualRate ?? 0,
});
```

- [ ] **Step 5: Build check**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/components/modules/SavingsVehiclesPage.tsx
git commit -m "feat: add annualRate field to SavingsVehicle type and form"
```

---

## Task 2: Add tab navigation and restructure the page

**Files:**
- Modify: `src/components/modules/SavingsVehiclesPage.tsx`

- [ ] **Step 1: Add tab state and tab bar to `SavingsVehiclesPage`**

At the top of the `SavingsVehiclesPage` component, add tab state:

```tsx
const [activeTab, setActiveTab] = useState<'manage' | 'forecast'>('manage');
```

After the page header `<div>` (the flex row with title and "+ הוסף" button), insert the tab bar:

```tsx
{/* Tab bar */}
<div className="flex border-b border-gray-200 mb-5 -mx-0">
  {(['manage', 'forecast'] as const).map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
        activeTab === tab
          ? 'border-lavender-dark text-lavender-dark'
          : 'border-transparent text-[#9090A8] hover:text-[#4A4A60]'
      }`}
    >
      {tab === 'manage' ? 'ניהול' : 'צפי'}
    </button>
  ))}
</div>
```

- [ ] **Step 2: Wrap existing management UI in `{activeTab === 'manage' && (...)}` guard**

Wrap everything from `{showAdd && ...}` down to the end of the life-goals section in a conditional:

```tsx
{activeTab === 'manage' && (
  <>
    {/* ── Add form ── */}
    {showAdd && ( ... )}

    {/* ── Empty state ── */}
    {savingsVehicles.length === 0 && !showAdd ? ( ... ) : ( ... )}
  </>
)}
```

- [ ] **Step 3: Add placeholder for "צפי" tab**

Right after the manage guard block, add:

```tsx
{activeTab === 'forecast' && (
  <div className="text-center py-8 text-[#9090A8] text-sm">
    בקרוב...
  </div>
)}
```

- [ ] **Step 4: Build check**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build
```

Expected: build succeeds. Tab bar appears on the page, "ניהול" shows existing content, "צפי" shows placeholder.

- [ ] **Step 5: Commit**

```bash
git add src/components/modules/SavingsVehiclesPage.tsx
git commit -m "feat: add tab navigation to SavingsVehiclesPage"
```

---

## Task 3: Add forecast math helpers and `ForecastCard` component

**Files:**
- Modify: `src/components/modules/SavingsVehiclesPage.tsx`

- [ ] **Step 1: Add forecast calculation helpers**

Add these functions near the top of the file, after the existing constants (before `emptyForm`):

```ts
interface ForecastRow {
  year: number;
  openingBalance: number;
  annualDeposits: number;
  interestEarned: number;
  closingBalance: number;
}

function buildForecastRows(
  initialBalance: number,
  monthlyDeposit: number,
  annualRate: number,
  years: number
): ForecastRow[] {
  const r = annualRate / 100 / 12;
  let bal = initialBalance;
  const rows: ForecastRow[] = [];

  for (let y = 1; y <= years; y++) {
    const opening = bal;
    const annualDeposits = monthlyDeposit * 12;
    let closing = bal;
    for (let m = 0; m < 12; m++) {
      closing = closing * (1 + r) + monthlyDeposit;
    }
    const interestEarned = closing - opening - annualDeposits;
    rows.push({
      year: y,
      openingBalance: Math.round(opening),
      annualDeposits: Math.round(annualDeposits),
      interestEarned: Math.round(interestEarned),
      closingBalance: Math.round(closing),
    });
    bal = closing;
  }
  return rows;
}

function buildChartData(
  initialBalance: number,
  monthlyDeposit: number,
  annualRate: number,
  years: number
): Array<{ year: number; עם_ריבית: number; ללא_ריבית: number }> {
  const r = annualRate / 100 / 12;
  let balWith = initialBalance;
  let balWithout = initialBalance;
  const data = [{ year: 0, עם_ריבית: Math.round(initialBalance), ללא_ריבית: Math.round(initialBalance) }];

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balWith = balWith * (1 + r) + monthlyDeposit;
      balWithout = balWithout + monthlyDeposit;
    }
    data.push({
      year: y,
      עם_ריבית: Math.round(balWith),
      ללא_ריבית: Math.round(balWithout),
    });
  }
  return data;
}
```

- [ ] **Step 2: Add `ForecastCard` component**

Add this component after `buildChartData` and before `VehicleForm`. It needs Recharts imports — add them at the top of the file:

```ts
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
```

Then the component:

```tsx
interface ForecastCardProps {
  vehicle: SavingsVehicle;
  globalYears: number;
  color: string;
}

function ForecastCard({ vehicle, globalYears, color }: ForecastCardProps) {
  const [yearsInput, setYearsInput] = useState('');
  const years = yearsInput ? Math.max(1, Math.min(40, Number(yearsInput))) : globalYears;
  const monthly = vehicle.employeeMonthlyDeposit + vehicle.employerMonthlyDeposit;
  const rate = vehicle.annualRate ?? 0;

  const chartData = useMemo(
    () => buildChartData(vehicle.balance, monthly, rate, years),
    [vehicle.balance, monthly, rate, years]
  );
  const tableRows = useMemo(
    () => buildForecastRows(vehicle.balance, monthly, rate, years),
    [vehicle.balance, monthly, rate, years]
  );

  const showInterestLine = rate > 0;
  const finalWithInterest = chartData[chartData.length - 1]?.עם_ריבית ?? 0;
  const finalWithout = chartData[chartData.length - 1]?.ללא_ריבית ?? 0;
  const interestBonus = finalWithInterest - finalWithout;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-[#1E1E2E]">{vehicle.name || TYPE_NAMES[vehicle.type]}</h4>
            <p className="text-xs text-[#9090A8]">
              יתרה: {formatCurrency(vehicle.balance)}
              {monthly > 0 && ` · +${formatCurrency(monthly)}/חודש`}
              {rate > 0 && ` · ${rate}% שנתי`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-[#9090A8]">שנים:</label>
            <input
              type="number"
              value={yearsInput}
              onChange={(e) => setYearsInput(e.target.value)}
              placeholder={String(globalYears)}
              min={1}
              max={40}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-lavender-dark bg-white"
            />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#9090A8]">צפי סופי</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(finalWithInterest)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#9090A8]">סה&quot;כ הופקד</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(vehicle.balance + monthly * 12 * years)}</p>
          </div>
          {showInterestLine && (
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-[#9090A8]">בונוס ריבית</p>
              <p className="text-sm font-bold text-green-600">{formatCurrency(interestBonus)}</p>
            </div>
          )}
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}י`} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `שנה ${label}`}
            />
            {showInterestLine && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <Line type="monotone" dataKey="עם_ריבית" stroke={color} strokeWidth={2} dot={false} />
            {showInterestLine && (
              <Line type="monotone" dataKey="ללא_ריבית" stroke="#D1D5DB" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Annual table */}
        <div className="mt-3 overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A] pr-1">שנה</th>
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">פתיחה</th>
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">הפקדות</th>
                {showInterestLine && <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">ריבית</th>}
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">סגירה</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1 pr-1 text-[#6B6B8A]">{row.year}</td>
                  <td className="py-1 text-[#4A4A60]">{formatCurrency(row.openingBalance)}</td>
                  <td className="py-1 text-[#4A4A60]">{formatCurrency(row.annualDeposits)}</td>
                  {showInterestLine && <td className="py-1 text-green-600 font-medium">{formatCurrency(row.interestEarned)}</td>}
                  <td className="py-1 font-semibold text-[#1E1E2E]">{formatCurrency(row.closingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/modules/SavingsVehiclesPage.tsx
git commit -m "feat: add ForecastCard component with chart and annual table"
```

---

## Task 4: Wire up "צפי" tab with global years slider and forecast cards

**Files:**
- Modify: `src/components/modules/SavingsVehiclesPage.tsx`

- [ ] **Step 1: Add `globalYears` state to `SavingsVehiclesPage`**

Inside the `SavingsVehiclesPage` component, add alongside `activeTab`:

```tsx
const [globalYears, setGlobalYears] = useState(10);
```

- [ ] **Step 2: Replace the "צפי" placeholder with the real content**

Replace the placeholder `{activeTab === 'forecast' && (...)}` block with:

```tsx
{activeTab === 'forecast' && (
  <div className="space-y-5">
    {/* Global years slider */}
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-[#1E1E2E]">צפי ל-{globalYears} שנים</p>
        <span className="text-xs text-[#9090A8]">ניתן לשנות לכל השקעה בנפרד</span>
      </div>
      <input
        type="range"
        min={1}
        max={40}
        step={1}
        value={globalYears}
        onChange={(e) => setGlobalYears(Number(e.target.value))}
        className="w-full accent-lavender-dark cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-[#9090A8] mt-1">
        <span>1 שנה</span>
        <span>10 שנים</span>
        <span>20 שנים</span>
        <span>40 שנים</span>
      </div>
    </div>

    {/* Per-vehicle forecast cards */}
    {savingsVehicles.length === 0 ? (
      <div className="text-center py-10 text-[#9090A8] bg-white rounded-xl border border-gray-100">
        <p className="text-sm mb-1">אין השקעות להציג</p>
        <p className="text-xs">הוסף השקעות בטאב ניהול כדי לראות צפי</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {savingsVehicles.map((vehicle) => (
          <ForecastCard
            key={vehicle.id}
            vehicle={vehicle}
            globalYears={globalYears}
            color={TYPE_COLORS[vehicle.type]}
          />
        ))}
      </div>
    )}

    {/* Compound interest calculator — rendered below in Task 5 */}
  </div>
)}
```

- [ ] **Step 3: Build check**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build
```

Expected: build succeeds. "צפי" tab shows global slider and a forecast card per vehicle.

- [ ] **Step 4: Commit**

```bash
git add src/components/modules/SavingsVehiclesPage.tsx
git commit -m "feat: wire up forecast tab with global years slider and per-vehicle cards"
```

---

## Task 5: Add `CompoundCalculator` component

**Files:**
- Modify: `src/components/modules/SavingsVehiclesPage.tsx`

- [ ] **Step 1: Add Recharts AreaChart to imports**

Update the Recharts import to include `AreaChart`, `Area`:

```ts
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
```

- [ ] **Step 2: Add `CompoundCalculator` component**

Add this component after `ForecastCard`, before `VehicleForm`:

```tsx
function CompoundCalculator() {
  const [principal, setPrincipal] = useState(50000);
  const [monthly, setMonthly] = useState(1000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(10);

  const calcData = useMemo(() => {
    const r = rate / 100 / 12;
    let bal = principal;
    const data: Array<{ year: number; יתרה: number; הופקד: number; ריבית: number }> = [
      { year: 0, יתרה: principal, הופקד: principal, ריבית: 0 },
    ];
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        bal = bal * (1 + r) + monthly;
      }
      const totalDeposited = principal + monthly * 12 * y;
      const interest = Math.round(bal) - totalDeposited;
      data.push({ year: y, יתרה: Math.round(bal), הופקד: totalDeposited, ריבית: Math.max(0, interest) });
    }
    return data;
  }, [principal, monthly, rate, years]);

  const last = calcData[calcData.length - 1];
  const totalDeposited = principal + monthly * 12 * years;
  const totalInterest = last.יתרה - totalDeposited;

  const INPUT_C = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-1 bg-lavender-dark" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🧮</span>
          <div>
            <h3 className="text-sm font-semibold text-[#1E1E2E]">מחשבון ריבית דריבית</h3>
            <p className="text-xs text-[#9090A8]">חשב צמיחת השקעה עצמאית</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">קרן התחלתית (₪)</label>
            <input type="number" value={principal || ''} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} placeholder="50,000" className={INPUT_C} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדה חודשית (₪)</label>
            <input type="number" value={monthly || ''} onChange={(e) => setMonthly(Number(e.target.value))} min={0} placeholder="1,000" className={INPUT_C} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ריבית שנתית (%)</label>
            <input type="number" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} min={0} max={30} step={0.1} placeholder="6" className={INPUT_C} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">מספר שנים</label>
            <input type="number" value={years || ''} onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))} min={1} max={40} placeholder="10" className={INPUT_C} />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-lavender-light rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#6B6B8A] mb-0.5">סכום סופי</p>
            <p className="text-base font-bold text-lavender-dark">{formatCurrency(last.יתרה)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#6B6B8A] mb-0.5">סה&quot;כ הופקד</p>
            <p className="text-base font-bold text-[#1E1E2E]">{formatCurrency(totalDeposited)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#6B6B8A] mb-0.5">ריבית שנצברה</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(Math.max(0, totalInterest))}</p>
          </div>
        </div>

        {/* Area chart */}
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={calcData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}י`} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
              labelFormatter={(label) => `שנה ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="הופקד" stackId="1" stroke="#7B6DC8" fill="#E8E4F8" strokeWidth={1.5} />
            <Area type="monotone" dataKey="ריבית" stackId="1" stroke="#5A9A42" fill="#EBF5E6" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>

        {/* Annual table */}
        <div className="mt-4 overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A] pr-1">שנה</th>
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">יתרה</th>
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">סה&quot;כ הופקד</th>
                <th className="text-right py-1.5 font-semibold text-[#6B6B8A]">ריבית מצטברת</th>
              </tr>
            </thead>
            <tbody>
              {calcData.slice(1).map((row) => (
                <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-1 pr-1 text-[#6B6B8A]">{row.year}</td>
                  <td className="py-1 font-semibold text-[#1E1E2E]">{formatCurrency(row.יתרה)}</td>
                  <td className="py-1 text-[#4A4A60]">{formatCurrency(row.הופקד)}</td>
                  <td className="py-1 text-green-600 font-medium">{formatCurrency(row.ריבית)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add `<CompoundCalculator />` to the "צפי" tab**

In the "צפי" tab JSX, replace the comment `{/* Compound interest calculator — rendered below in Task 5 */}` with:

```tsx
{/* Compound interest calculator */}
<CompoundCalculator />
```

- [ ] **Step 4: Build check**

```bash
cd /Users/liorgabay/Documents/projects/FINANCE_ISRAEL && npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/modules/SavingsVehiclesPage.tsx
git commit -m "feat: add compound interest calculator to forecast tab"
```

---

## Self-Review

**Spec coverage:**
- ✅ `annualRate` user-entered per vehicle — Task 1
- ✅ Tab navigation (ניהול / צפי) — Task 2
- ✅ Global years slider — Task 4
- ✅ Per-vehicle years override — Task 3 (ForecastCard)
- ✅ Line chart per vehicle (with/without interest) — Task 3
- ✅ Annual table per vehicle — Task 3
- ✅ Compound calculator KPI row + chart + table — Task 5
- ✅ Empty state when no vehicles — Task 4

**Placeholder scan:** No TBDs or "implement later" phrases.

**Type consistency:**
- `ForecastRow` defined in Task 3 Step 1, used in same step — consistent
- `ForecastCardProps` uses `SavingsVehicle` from `src/types/index.ts` with `annualRate?: number` added in Task 1 — consistent
- `buildForecastRows`, `buildChartData` defined before `ForecastCard` uses them — consistent
- `TYPE_COLORS`, `TYPE_NAMES` already exist in the file — reused correctly
- `formatCurrency` already imported — reused correctly
