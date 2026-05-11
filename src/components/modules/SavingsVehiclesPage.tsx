import { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsVehicle, SavingsVehicleType } from '../../types';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const TYPE_NAMES: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'קרן השתלמות',
  pension: 'קרן פנסיה',
  kupat_gemel: 'קופת גמל',
  child_savings: 'חסכון לכל ילד',
};

const TYPE_COLORS: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: '#4A90C0',
  pension: '#5A9A42',
  kupat_gemel: '#C89E50',
  child_savings: '#C85590',
};

const TYPE_DESCRIPTIONS: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'פטורה ממס לאחר 6 שנים',
  pension: 'קצבת פרישה חודשית',
  kupat_gemel: 'חיסכון לטווח בינוני-ארוך',
  child_savings: '₪58 מהמדינה + 58 אופציונלי',
};

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

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
): Array<{ year: number; withInterest: number; withoutInterest: number }> {
  const r = annualRate / 100 / 12;
  let balWith = initialBalance;
  let balWithout = initialBalance;
  const data = [{ year: 0, withInterest: Math.round(initialBalance), withoutInterest: Math.round(initialBalance) }];

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balWith = balWith * (1 + r) + monthlyDeposit;
      balWithout = balWithout + monthlyDeposit;
    }
    data.push({
      year: y,
      withInterest: Math.round(balWith),
      withoutInterest: Math.round(balWithout),
    });
  }
  return data;
}

interface ForecastCardProps {
  vehicle: SavingsVehicle;
  globalYears: number;
  color: string;
}

function ForecastCard({ vehicle, globalYears, color }: ForecastCardProps) {
  const [yearsInput, setYearsInput] = useState('');
  const parsed = Number(yearsInput);
  const years = yearsInput && !isNaN(parsed) ? Math.max(1, Math.min(40, parsed)) : globalYears;
  const monthly = vehicle.employeeMonthlyDeposit + vehicle.employerMonthlyDeposit;
  const rate = Math.min(Math.max(vehicle.annualRate ?? 0, 0), 100);

  const chartData = useMemo(
    () => buildChartData(vehicle.balance, monthly, rate, years),
    [vehicle.balance, monthly, rate, years]
  );
  const tableRows = useMemo(
    () => buildForecastRows(vehicle.balance, monthly, rate, years),
    [vehicle.balance, monthly, rate, years]
  );

  const showInterestLine = rate > 0;
  const finalWithInterest = chartData[chartData.length - 1]?.withInterest ?? 0;
  const finalWithout = chartData[chartData.length - 1]?.withoutInterest ?? 0;
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
              step={1}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-lavender-dark bg-white"
            />
          </div>
        </div>

        {/* KPI row */}
        <div className={`grid ${showInterestLine ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mb-4`}>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#9090A8]">צפי סופי</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(finalWithInterest)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-[#9090A8]">הפקדות עתידיות</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(monthly * 12 * years)}</p>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
              labelFormatter={(label) => `שנה ${label}`}
            />
            {showInterestLine && <Legend wrapperStyle={{ fontSize: 11 }} />}
            <Line type="monotone" dataKey="withInterest" name="עם ריבית" stroke={color} strokeWidth={2} dot={false} />
            {showInterestLine && (
              <Line type="monotone" dataKey="withoutInterest" name="ללא ריבית" stroke="#D1D5DB" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
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

function CompoundCalculator() {
  const [principal, setPrincipal] = useState(50000);
  const [monthly, setMonthly] = useState(1000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(10);

  const calcData = useMemo(() => {
    const r = rate / 100 / 12;
    let bal = principal;
    const data: Array<{ year: number; הופקד: number; ריבית: number }> = [
      { year: 0, הופקד: principal, ריבית: 0 },
    ];
    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        bal = bal * (1 + r) + monthly;
      }
      const totalDeposited = principal + monthly * 12 * y;
      const interest = Math.round(bal) - totalDeposited;
      data.push({ year: y, הופקד: totalDeposited, ריבית: Math.max(0, interest) });
    }
    return data;
  }, [principal, monthly, rate, years]);

  const last = calcData[calcData.length - 1];
  const totalDeposited = principal + monthly * 12 * years;
  const totalInterest = last?.ריבית ?? 0;

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
            <input type="number" value={principal || ''} onChange={(e) => setPrincipal(Number(e.target.value))} min={0} placeholder="50,000" className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדה חודשית (₪)</label>
            <input type="number" value={monthly || ''} onChange={(e) => setMonthly(Number(e.target.value))} min={0} placeholder="1,000" className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ריבית שנתית (%)</label>
            <input type="number" value={rate || ''} onChange={(e) => setRate(Number(e.target.value))} min={0} max={30} step={0.1} placeholder="6" className={INPUT_CLS} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">מספר שנים</label>
            <input type="number" value={years || ''} onChange={(e) => setYears(Math.max(1, Math.min(40, Number(e.target.value))))} min={1} max={40} placeholder="10" className={INPUT_CLS} />
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-lavender-light rounded-xl p-3 text-center">
            <p className="text-[10px] text-[#6B6B8A] mb-0.5">סכום סופי</p>
            <p className="text-base font-bold text-lavender-dark">{formatCurrency((last?.הופקד ?? 0) + (last?.ריבית ?? 0))}</p>
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
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [formatCurrency(value), name]}
              labelFormatter={(label) => `שנה ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="הופקד" stackId="1" name="סה״כ הופקד" stroke="#7B6DC8" fill="#E8E4F8" strokeWidth={1.5} />
            <Area type="monotone" dataKey="ריבית" stackId="1" name="ריבית" stroke="#5A9A42" fill="#EBF5E6" strokeWidth={1.5} />
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
                  <td className="py-1 font-semibold text-[#1E1E2E]">{formatCurrency(row.הופקד + row.ריבית)}</td>
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

interface VehicleFormProps { f: Omit<SavingsVehicle, 'id'>; setF: (v: Omit<SavingsVehicle, 'id'>) => void; }

function VehicleForm({ f, setF }: VehicleFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סוג</label>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as SavingsVehicleType })} className={`${INPUT_CLS} cursor-pointer`}>
          {Object.entries(TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם / מוסד</label>
        <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="למשל: הפניקס, מגדל" className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יתרה נוכחית (₪)</label>
        <input type="number" value={f.balance || ''} onChange={(e) => setF({ ...f, balance: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדת עובד/ת חודשית (₪)</label>
        <input type="number" value={f.employeeMonthlyDeposit || ''} onChange={(e) => setF({ ...f, employeeMonthlyDeposit: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הפקדת מעסיק חודשית (₪)</label>
        <input type="number" value={f.employerMonthlyDeposit || ''} onChange={(e) => setF({ ...f, employerMonthlyDeposit: Number(e.target.value) })} placeholder="0" min={0} className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תשואה שנתית (%)</label>
        <input type="number" value={f.annualRate || ''} onChange={(e) => setF({ ...f, annualRate: Number(e.target.value) })} placeholder="0" min={0} max={30} step={0.1} className={INPUT_CLS} />
      </div>
      {f.type === 'keren_hishtalmut' && (
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תאריך פתיחה (לחישוב 6 שנים)</label>
          <input type="date" value={f.lockDate ?? ''} onChange={(e) => setF({ ...f, lockDate: e.target.value })} className={INPUT_CLS} />
        </div>
      )}
      {f.type === 'child_savings' && (
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם הילד/ה</label>
          <input type="text" value={f.childName ?? ''} onChange={(e) => setF({ ...f, childName: e.target.value })} placeholder="שם הילד/ה" className={INPUT_CLS} />
        </div>
      )}
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
        <input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="אופציונלי" className={INPUT_CLS} />
      </div>
    </div>
  );
}

export default function SavingsVehiclesPage() {
  const savingsVehicles = useFinanceStore((s) => s.savingsVehicles);
  const addSavingsVehicle = useFinanceStore((s) => s.addSavingsVehicle);
  const updateSavingsVehicle = useFinanceStore((s) => s.updateSavingsVehicle);
  const deleteSavingsVehicle = useFinanceStore((s) => s.deleteSavingsVehicle);

  const [activeTab, setActiveTab] = useState<'manage' | 'forecast'>('manage');
  const [globalYears, setGlobalYears] = useState(10);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<SavingsVehicle, 'id'>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<SavingsVehicle, 'id'>>(emptyForm());

  const totalBalance = savingsVehicles.reduce((s, v) => s + v.balance, 0);
  const totalMonthly = savingsVehicles.reduce((s, v) => s + v.employeeMonthlyDeposit + v.employerMonthlyDeposit, 0);

  const handleAdd = () => {
    if (!form.name || form.balance < 0) return;
    addSavingsVehicle(form);
    setForm(emptyForm());
    setShowAdd(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">חסכונות ופנסיה</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">קרן השתלמות, פנסיה, קופת גמל, חסכון לכל ילד</p>
        </div>
        {activeTab === 'manage' && (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] cursor-pointer shadow-sm">
            + הוסף
          </button>
        )}
      </div>

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

      {activeTab === 'manage' && (
        <>
          {totalBalance > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1 bg-sage-dark" />
                <div className="p-4">
                  <p className="text-xs text-[#9090A8] mb-1">סה&quot;כ חסכונות מוסדיים</p>
                  <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalBalance)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1 bg-[#4A90C0]" />
                <div className="p-4">
                  <p className="text-xs text-[#9090A8] mb-1">הפקדות חודשיות כוללות</p>
                  <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalMonthly)}</p>
                  <p className="text-xs text-[#9090A8] mt-1">עובד + מעסיק</p>
                </div>
              </div>
            </div>
          )}

          {showAdd && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-3">הוסף חיסכון מוסדי</h3>
              <VehicleForm f={form} setF={setForm} />
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => { setShowAdd(false); setForm(emptyForm()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                <button onClick={handleAdd} className="bg-lavender-dark text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer">הוסף</button>
              </div>
            </div>
          )}

          {savingsVehicles.length === 0 && !showAdd ? (
            <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
              <p className="text-sm mb-2">אין חסכונות מוסדיים מוגדרים</p>
              <p className="text-xs">הוסף קרן השתלמות, פנסיה, קופת גמל וחסכון לכל ילד</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(['keren_hishtalmut', 'pension', 'kupat_gemel', 'child_savings'] as SavingsVehicleType[]).map((type) => {
                const typeVehicles = savingsVehicles.filter((v) => v.type === type);
                if (typeVehicles.length === 0) return null;
                const color = TYPE_COLORS[type];

                return (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      {TYPE_NAMES[type]}
                      <span className="text-[10px] font-normal text-[#C89E50]">{TYPE_DESCRIPTIONS[type]}</span>
                    </h3>
                    <div className="space-y-2">
                      {typeVehicles.map((vehicle) => {
                        const totalDeposit = vehicle.employeeMonthlyDeposit + vehicle.employerMonthlyDeposit;
                        const isKH = vehicle.type === 'keren_hishtalmut';
                        const eligible = isKH && vehicle.lockDate ? (() => {
                          const openDate = new Date(vehicle.lockDate);
                          const eligibleDate = new Date(openDate);
                          eligibleDate.setFullYear(eligibleDate.getFullYear() + 6);
                          const now = new Date();
                          return { isEligible: now >= eligibleDate, date: eligibleDate.toLocaleDateString('he-IL') };
                        })() : null;

                        return (
                          <div key={vehicle.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="h-1" style={{ backgroundColor: color }} />
                            {editingId === vehicle.id ? (
                              <div className="p-4">
                                <VehicleForm f={editForm} setF={setEditForm} />
                                <div className="flex gap-2 mt-3 justify-end">
                                  <button onClick={() => setEditingId(null)} className="text-sm text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                                  <button onClick={() => { updateSavingsVehicle(vehicle.id, editForm); setEditingId(null); }} className="bg-sage-dark text-white px-4 py-1.5 rounded-lg text-sm cursor-pointer">שמור</button>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="font-semibold text-[#1E1E2E]">{vehicle.name || TYPE_NAMES[vehicle.type]}</h4>
                                    {vehicle.childName && <p className="text-xs text-[#9090A8]">{vehicle.childName}</p>}
                                    {eligible && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${eligible.isEligible ? 'bg-sage-light text-sage-dark' : 'bg-amber-50 text-amber-700'}`}>
                                        {eligible.isEligible ? '✓ פטורה ממס — ניתן למשוך' : `זכאות: ${eligible.date}`}
                                      </span>
                                    )}
                                    {vehicle.notes && <p className="text-xs text-[#9090A8] mt-1">{vehicle.notes}</p>}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(vehicle.balance)}</p>
                                    {totalDeposit > 0 && (
                                      <p className="text-xs text-[#9090A8] mt-0.5">
                                        +{formatCurrency(vehicle.employeeMonthlyDeposit)}
                                        {vehicle.employerMonthlyDeposit > 0 && ` + ${formatCurrency(vehicle.employerMonthlyDeposit)} מעסיק`}
                                        /חודש
                                      </p>
                                    )}
                                    {(vehicle.annualRate ?? 0) > 0 && (
                                      <p className="text-xs text-[#9090A8] mt-0.5">{vehicle.annualRate}% תשואה שנתית</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                                  <button onClick={() => { setEditingId(vehicle.id); setEditForm({ type: vehicle.type, name: vehicle.name, balance: vehicle.balance, employeeMonthlyDeposit: vehicle.employeeMonthlyDeposit, employerMonthlyDeposit: vehicle.employerMonthlyDeposit, notes: vehicle.notes, lockDate: vehicle.lockDate, childName: vehicle.childName, annualRate: vehicle.annualRate ?? 0 }); }} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">עריכה</button>
                                  <button onClick={() => { if (window.confirm('למחוק?')) deleteSavingsVehicle(vehicle.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 cursor-pointer">מחיקה</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

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

          {/* Compound interest calculator */}
          <CompoundCalculator />
        </div>
      )}
    </div>
  );
}
