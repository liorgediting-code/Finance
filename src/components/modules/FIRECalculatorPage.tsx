import { useState, useMemo } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { computeMonthTotals } from '../../utils/monthlyTotals';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#9090A8]';

function calcYearsToFI(
  currentSavings: number,
  nestEgg: number,
  monthlySavings: number,
  annualReturnPct: number
): number | null {
  if (currentSavings >= nestEgg) return 0;
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  if (monthlyRate <= 0 && monthlySavings <= 0) return null;
  for (let months = 1; months <= 720; months++) {
    const fvCurrent = currentSavings * Math.pow(1 + monthlyRate, months);
    const fvSavings = monthlyRate > 0
      ? monthlySavings * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
      : monthlySavings * months;
    if (fvCurrent + fvSavings >= nestEgg) return months / 12;
  }
  return null;
}

function buildGrowthChart(
  currentSavings: number,
  nestEgg: number,
  monthlySavings: number,
  annualReturnPct: number,
  yearsToShow: number
): { year: number; balance: number; target: number }[] {
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  const points: { year: number; balance: number; target: number }[] = [];
  for (let y = 0; y <= Math.ceil(yearsToShow) + 2; y++) {
    const months = y * 12;
    const fvCurrent = currentSavings * Math.pow(1 + monthlyRate, months);
    const fvSavings = monthlyRate > 0
      ? monthlySavings * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
      : monthlySavings * months;
    points.push({ year: y, balance: Math.round(fvCurrent + fvSavings), target: Math.round(nestEgg) });
  }
  return points;
}

export default function FIRECalculatorPage() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const savingsFunds = useFinanceStore(useShallow((s) => s.savingsFunds));
  const savingsVehicles = useFinanceStore(useShallow((s) => s.savingsVehicles));

  const today = new Date();
  const currentMonth = today.getMonth();
  const avgSurplus = useMemo(() => {
    const samples: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const mi = ((currentMonth - i) + 12) % 12;
      const md = months[mi];
      if (!md) continue;
      const t = computeMonthTotals(md, recurringIncomes, recurringExpenses);
      if (t.totalIncome > 0) samples.push(Math.max(0, t.totalIncome - t.totalExpenses));
    }
    return samples.length > 0 ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : 0;
  }, [months, recurringIncomes, recurringExpenses, currentMonth]);

  const avgExpenses = useMemo(() => {
    const samples: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const mi = ((currentMonth - i) + 12) % 12;
      const md = months[mi];
      if (!md) continue;
      const t = computeMonthTotals(md, recurringIncomes, recurringExpenses);
      if (t.totalExpenses > 0) samples.push(t.totalExpenses);
    }
    return samples.length > 0 ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : 0;
  }, [months, recurringIncomes, recurringExpenses, currentMonth]);

  const autoSavings = useMemo(() => {
    const funds = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
    const vehicles = savingsVehicles.reduce((s, v) => s + v.balance, 0);
    return funds + vehicles;
  }, [savingsFunds, savingsVehicles]);

  const [currentAge, setCurrentAge] = useState('35');
  const [retireAge, setRetireAge] = useState('55');
  const [retireExpenses, setRetireExpenses] = useState(String(avgExpenses || ''));
  const [currentSavings, setCurrentSavings] = useState(String(autoSavings || ''));
  const [monthlySavingsInput, setMonthlySavingsInput] = useState(String(avgSurplus || ''));
  const [annualReturn, setAnnualReturn] = useState('7');
  const [withdrawalRate, setWithdrawalRate] = useState('4');

  const nestEgg = useMemo(() => {
    const exp = Number(retireExpenses);
    const wr = Number(withdrawalRate) / 100;
    if (!exp || !wr) return 0;
    return (exp * 12) / wr;
  }, [retireExpenses, withdrawalRate]);

  const yearsTarget = Number(retireAge) - Number(currentAge);
  const requiredMonthlySavings = useMemo(() => {
    if (!nestEgg || yearsTarget <= 0) return 0;
    const cs = Number(currentSavings);
    const r = Math.pow(1 + Number(annualReturn) / 100, 1 / 12) - 1;
    const n = yearsTarget * 12;
    if (r <= 0) return Math.max(0, (nestEgg - cs) / n);
    const fvCurrent = cs * Math.pow(1 + r, n);
    if (fvCurrent >= nestEgg) return 0;
    return (nestEgg - fvCurrent) * r / (Math.pow(1 + r, n) - 1);
  }, [nestEgg, currentSavings, annualReturn, yearsTarget]);

  const yearsToFI = useMemo(() => calcYearsToFI(
    Number(currentSavings), nestEgg, Number(monthlySavingsInput), Number(annualReturn)
  ), [currentSavings, nestEgg, monthlySavingsInput, annualReturn]);

  const chartYears = Math.min(60, Math.ceil((yearsToFI ?? yearsTarget + 10) * 1.3 + 5));
  const chartData = useMemo(() => buildGrowthChart(
    Number(currentSavings), nestEgg, Number(monthlySavingsInput), Number(annualReturn), chartYears
  ), [currentSavings, nestEgg, monthlySavingsInput, annualReturn, chartYears]);

  const fiAgeIfCurrent = yearsToFI != null ? Number(currentAge) + yearsToFI : null;

  const formatK = (v: number) => {
    if (v >= 1_000_000) return `₪${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return `₪${(v / 1000).toFixed(0)}K`;
    return `₪${v}`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-[#1E1E2E]">מחשבון עצמאות כלכלית (FIRE)</h1>
        <p className="text-sm text-[#9090A8] mt-0.5">כמה צריך לחסוך כדי לפרוש מוקדם ולחיות מהשקעות?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-[#1E1E2E]">פרטים אישיים</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6B6B8A] mb-1 block">גיל נוכחי</label>
              <input className={inputCls} type="number" min="18" max="80" value={currentAge} onChange={(e) => setCurrentAge(e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-[#6B6B8A] mb-1 block">גיל יעד לפרישה</label>
              <input className={inputCls} type="number" min="30" max="90" value={retireAge} onChange={(e) => setRetireAge(e.target.value)} dir="ltr" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6B6B8A] mb-1 block">הוצאות חודשיות בפרישה (₪)</label>
            <input className={inputCls} type="number" min="0" value={retireExpenses} onChange={(e) => setRetireExpenses(e.target.value)} placeholder={avgExpenses ? `ממוצע נוכחי: ${avgExpenses.toLocaleString()}` : 'לדוגמה: 15000'} dir="ltr" />
            {avgExpenses > 0 && !retireExpenses && (
              <button onClick={() => setRetireExpenses(String(avgExpenses))} className="text-xs text-lavender-dark mt-1 cursor-pointer">השתמש בממוצע הנוכחי ({avgExpenses.toLocaleString()} ₪)</button>
            )}
          </div>

          <div>
            <label className="text-xs text-[#6B6B8A] mb-1 block">חסכונות והשקעות נוכחיים (₪)</label>
            <input className={inputCls} type="number" min="0" value={currentSavings} onChange={(e) => setCurrentSavings(e.target.value)} dir="ltr" />
            {autoSavings > 0 && (
              <p className="text-xs text-[#9090A8] mt-1">זוהה אוטומטית: {formatCurrency(autoSavings)} (ניתן לשנות)</p>
            )}
          </div>

          <div>
            <label className="text-xs text-[#6B6B8A] mb-1 block">חיסכון חודשי נוכחי (₪)</label>
            <input className={inputCls} type="number" min="0" value={monthlySavingsInput} onChange={(e) => setMonthlySavingsInput(e.target.value)} dir="ltr" />
            {avgSurplus > 0 && (
              <p className="text-xs text-[#9090A8] mt-1">עודף ממוצע: {formatCurrency(avgSurplus)}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6B6B8A] mb-1 block">תשואה שנתית צפויה (%)</label>
              <input className={inputCls} type="number" min="0" max="30" step="0.5" value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="text-xs text-[#6B6B8A] mb-1 block">שיעור משיכה שנתי (%)</label>
              <input className={inputCls} type="number" min="1" max="10" step="0.5" value={withdrawalRate} onChange={(e) => setWithdrawalRate(e.target.value)} dir="ltr" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm font-semibold text-[#1E1E2E] mb-4">תוצאות</p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-[#6B6B8A]">קן ביצים נדרש</span>
                <span className="font-bold text-[#1E1E2E] text-lg">{nestEgg > 0 ? formatCurrency(nestEgg) : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-[#6B6B8A]">עוד לחסוך</span>
                <span className="font-bold text-[#1E1E2E]">
                  {nestEgg > 0 ? formatCurrency(Math.max(0, nestEgg - Number(currentSavings))) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-[#6B6B8A]">חיסכון חודשי נדרש לפרישה בגיל {retireAge}</span>
                <span className={`font-bold text-lg ${requiredMonthlySavings > Number(monthlySavingsInput) ? 'text-red-500' : 'text-green-600'}`}>
                  {requiredMonthlySavings > 0 ? formatCurrency(Math.round(requiredMonthlySavings)) : 'כבר מכוסה!'}
                </span>
              </div>
              {yearsToFI != null ? (
                <div className="bg-green-50 rounded-xl p-4 mt-2">
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">עצמאות כלכלית עם קצב נוכחי</p>
                  <p className="text-3xl font-bold text-green-700">{yearsToFI.toFixed(1)} שנים</p>
                  {fiAgeIfCurrent != null && (
                    <p className="text-sm text-green-600 mt-1">בגיל {fiAgeIfCurrent.toFixed(0)}</p>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 mt-2">
                  <p className="text-xs text-amber-700 font-semibold mb-1">בקצב נוכחי</p>
                  <p className="text-sm text-amber-700">הגדל חיסכון חודשי כדי להגיע לעצמאות כלכלית</p>
                </div>
              )}
            </div>
          </div>

          {requiredMonthlySavings > 0 && Number(monthlySavingsInput) > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-xs text-[#6B6B8A] mb-2">פער חיסכון חודשי</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-lavender"
                    style={{ width: `${Math.min(100, (Number(monthlySavingsInput) / requiredMonthlySavings) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-[#1E1E2E]">
                  {Math.round((Number(monthlySavingsInput) / requiredMonthlySavings) * 100)}%
                </span>
              </div>
              <p className="text-xs text-[#9090A8] mt-1">
                חוסך {formatCurrency(Number(monthlySavingsInput))} מתוך {formatCurrency(Math.round(requiredMonthlySavings))} נדרש
              </p>
            </div>
          )}
        </div>
      </div>

      {nestEgg > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-semibold text-[#1E1E2E] mb-4">צמיחת חסכונות לאורך זמן</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tickFormatter={(v) => `שנה ${v}`} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatK} tick={{ fontSize: 11 }} width={65} />
              <Tooltip formatter={(v: unknown) => typeof v === 'number' ? formatCurrency(v) : ''} labelFormatter={(l) => `שנה ${l}`} />
              {yearsToFI != null && (
                <ReferenceLine x={Math.round(yearsToFI)} stroke="#50A878" strokeDasharray="4 4" label={{ value: 'FI!', position: 'top', fontSize: 11, fill: '#50A878' }} />
              )}
              <Line type="monotone" dataKey="balance" name="יתרה" stroke="#7B6DC8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="target" name="יעד" stroke="#E8B040" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-[#9090A8] text-center mt-2">
            הנחות: תשואה {annualReturn}% לשנה · חיסכון חודשי {formatCurrency(Number(monthlySavingsInput))} · אינפלציה לא נלקחת בחשבון
          </p>
        </div>
      )}

      <div className="bg-amber-50 rounded-xl p-4 text-xs text-amber-800">
        <strong>הערה:</strong> חישובים אלו הם הערכה בלבד ואינם מהווים ייעוץ פיננסי. התוצאות מבוססות על תשואה קבועה ואינן מתחשבות באינפלציה, שינויי מס, או תנודות שוק. מומלץ להתייעץ עם יועץ פיננסי מוסמך.
      </div>
    </div>
  );
}
