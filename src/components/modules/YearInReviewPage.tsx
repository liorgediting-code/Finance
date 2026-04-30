import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { HEBREW_MONTHS } from '../../config/months';
import { CATEGORIES } from '../../config/categories';

function StatCard({
  label,
  value,
  sub,
  color = '#7B6DC8',
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
      <p className="text-xs text-[#9090A8] mb-1">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-[#9090A8] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function YearInReviewPage() {
  const year = useFinanceStore((s) => s.settings.year);
  const recurringIncomes = useFinanceStore(useShallow((s) => s.recurringIncomes));
  const recurringExpenses = useFinanceStore(useShallow((s) => s.recurringExpenses));
  const { months } = useActiveBoardData();

  const recurringInc = sumAmounts(recurringIncomes);
  const recurringExp = sumAmounts(recurringExpenses);

  const monthlyData = useMemo(() => {
    return HEBREW_MONTHS.map((name, idx) => {
      const md = months[idx];
      const income = recurringInc + sumAmounts(md?.income ?? []);
      const expenses = recurringExp + sumAmounts(md?.expenses ?? []);
      const saved = income - expenses;
      return { name, income, expenses, saved };
    });
  }, [months, recurringInc, recurringExp]);

  const activeMonths = monthlyData.filter((m) => m.income > 0 || m.expenses > 0);

  const totalIncome = activeMonths.reduce((s, m) => s + m.income, 0);
  const totalExpenses = activeMonths.reduce((s, m) => s + m.expenses, 0);
  const totalSaved = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 100) : 0;

  const bestMonth = activeMonths.length > 0
    ? activeMonths.reduce((best, m) => (m.saved > best.saved ? m : best), activeMonths[0])
    : null;
  const worstMonth = activeMonths.length > 0
    ? activeMonths.reduce((worst, m) => (m.saved < worst.saved ? m : worst), activeMonths[0])
    : null;

  // Top expense categories across all months
  const categoryTotals: Record<string, number> = {};
  Object.values(months).forEach((md) => {
    (md?.expenses ?? []).forEach((e) => {
      categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] ?? 0) + e.amount;
    });
  });
  recurringExpenses.forEach((e) => {
    categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] ?? 0) + e.amount;
  });

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, total]) => ({
      id,
      name: CATEGORIES.find((c) => c.id === id)?.nameHe ?? id,
      color: CATEGORIES.find((c) => c.id === id)?.color ?? '#B0A8C8',
      total,
    }));

  const greenMonths = activeMonths.filter((m) => m.saved > 0).length;

  const handlePrint = () => window.print();

  if (activeMonths.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto text-center" dir="rtl">
        <h1 className="text-2xl font-bold text-[#1E1E2E] mb-4">סיכום שנת {year}</h1>
        <div className="bg-gray-50 rounded-xl p-8">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-[#6B6B8A]">אין עדיין נתונים לסיכום שנתי. הוסף הכנסות והוצאות כדי לראות את הסיכום.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 print:p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">סיכום שנת {year}</h1>
          <p className="text-sm text-[#9090A8] mt-1">מבט שנתי על הפיננסים שלך</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 text-sm text-[#6B6B8A] hover:text-[#1E1E2E] hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors cursor-pointer print:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          הדפס
        </button>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="סה״כ הכנסה" value={formatCurrency(totalIncome)} color="#22C55E" />
        <StatCard label="סה״כ הוצאות" value={formatCurrency(totalExpenses)} color="#EF4444" />
        <StatCard
          label="נחסך השנה"
          value={formatCurrency(Math.abs(totalSaved))}
          sub={totalSaved < 0 ? 'גירעון' : undefined}
          color={totalSaved >= 0 ? '#7B6DC8' : '#EF4444'}
        />
        <StatCard
          label="אחוז חיסכון"
          value={`${savingsRate}%`}
          color={savingsRate >= 20 ? '#22C55E' : savingsRate >= 10 ? '#F59E0B' : '#EF4444'}
        />
      </div>

      {/* Monthly chart */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">הכנסות מול הוצאות — לפי חודש</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9090A8' }} />
            <YAxis tick={{ fontSize: 10, fill: '#9090A8' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelStyle={{ direction: 'rtl' }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
            />
            <Bar dataKey="income" name="הכנסה" fill="#C5CDB6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="הוצאות" fill="#F2C4C4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Highlights row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bestMonth && bestMonth.saved > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">החודש הטוב ביותר</p>
            <p className="text-lg font-bold text-green-800">{bestMonth.name}</p>
            <p className="text-sm text-green-700">חיסכון: {formatCurrency(bestMonth.saved)}</p>
          </div>
        )}
        {worstMonth && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">החודש המאתגר ביותר</p>
            <p className="text-lg font-bold text-red-800">{worstMonth.name}</p>
            <p className="text-sm text-red-700">
              {worstMonth.saved >= 0
                ? `חיסכון: ${formatCurrency(worstMonth.saved)}`
                : `גירעון: ${formatCurrency(Math.abs(worstMonth.saved))}`}
            </p>
          </div>
        )}
        <div className="bg-lavender-light border border-lavender rounded-xl p-4">
          <p className="text-xs font-semibold text-lavender-dark uppercase tracking-wider mb-1">חודשים ירוקים</p>
          <p className="text-lg font-bold text-[#1E1E2E]">{greenMonths} / {activeMonths.length}</p>
          <p className="text-sm text-[#6B6B8A]">חודשים עם עודף</p>
        </div>
      </div>

      {/* Top categories */}
      {topCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">קטגוריות הוצאה מובילות</h2>
          <div className="space-y-3">
            {topCategories.map((cat, i) => {
              const pct = totalExpenses > 0 ? Math.round((cat.total / totalExpenses) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#6B6B8A]">#{i + 1}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium text-[#1E1E2E]">{cat.name}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(cat.total)}</span>
                      <span className="text-xs text-[#9090A8] mr-1.5">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
