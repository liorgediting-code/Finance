import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function getHeatColor(pct: number): { bg: string; text: string } {
  if (pct === 0) return { bg: '#F8F8FC', text: '#9090A8' };
  if (pct < 0.25) return { bg: '#EDE9F8', text: '#5B52A0' };
  if (pct < 0.5)  return { bg: '#D4CCEE', text: '#4A3E90' };
  if (pct < 0.75) return { bg: '#B5A9E0', text: '#2E2170' };
  return { bg: '#7B6DC8', text: '#FFFFFF' };
}

interface MonthStat {
  index: number;
  name: string;
  total: number;
  incomeTotal: number;
  count: number;
  net: number;
}

export default function SpendingHeatmapPage() {
  const navigate = useNavigate();
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);
  const familyMembers = useFinanceStore(useShallow((s) => s.familyMembers));

  const stats: MonthStat[] = useMemo(() => {
    const recurringExp = recurringExpenses.reduce((s, e) => s + e.amount, 0);
    const recurringInc = recurringIncomes.reduce((s, e) => s + e.amount, 0);

    return MONTH_NAMES.map((name, index) => {
      const md = months[index];
      const expenses = md?.expenses ?? [];
      const income = md?.income ?? [];
      const monthlyExp = expenses
        .filter((e) => !e.isFuture && !e.isPending)
        .reduce((s, e) => s + e.amount, 0);
      const monthlyInc = income
        .filter((e) => !e.isFuture)
        .reduce((s, e) => s + e.amount, 0);
      const total = monthlyExp + (md ? recurringExp : 0);
      const incomeTotal = monthlyInc + (md ? recurringInc : 0);
      const count = expenses.length;
      return { index, name, total, incomeTotal, count, net: incomeTotal - total };
    });
  }, [months, recurringExpenses, recurringIncomes]);

  const maxSpend = Math.max(...stats.map((s) => s.total), 1);
  const totalYearSpend = stats.reduce((s, m) => s + m.total, 0);
  const totalYearIncome = stats.reduce((s, m) => s + m.incomeTotal, 0);
  const monthsWithData = stats.filter((m) => m.total > 0 || m.incomeTotal > 0).length;
  const avgMonthlySpend = monthsWithData > 0 ? totalYearSpend / monthsWithData : 0;

  const currentMonth = new Date().getMonth();

  const handleMonthClick = (index: number) => {
    navigate('/month', { state: { monthIndex: index } });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E1E2E]">מפת חום הוצאות</h1>
        <span className="text-sm text-[#6B6B8A]">{year}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-[#6B6B8A] mb-1">סה&quot;כ הוצאות</p>
          <p className="text-lg font-bold text-[#1E1E2E]">{formatCurrency(totalYearSpend)}</p>
          <p className="text-xs text-[#9090A8]">שנת {year}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-[#6B6B8A] mb-1">סה&quot;כ הכנסות</p>
          <p className="text-lg font-bold text-[#1E1E2E]">{formatCurrency(totalYearIncome)}</p>
          <p className="text-xs text-[#9090A8]">שנת {year}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-[#6B6B8A] mb-1">ממוצע חודשי</p>
          <p className="text-lg font-bold text-[#1E1E2E]">{formatCurrency(avgMonthlySpend)}</p>
          <p className="text-xs text-[#9090A8]">בחודשים עם נתונים</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-[#6B6B8A] mb-1">יתרה שנתית</p>
          <p className={`text-lg font-bold ${(totalYearIncome - totalYearSpend) >= 0 ? 'text-[#5A9A42]' : 'text-red-600'}`}>
            {formatCurrency(totalYearIncome - totalYearSpend)}
          </p>
          <p className="text-xs text-[#9090A8]">הכנסות פחות הוצאות</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider">עוצמת הוצאות — לחץ חודש לפרטים</h2>
          <div className="flex items-center gap-1 text-[10px] text-[#9090A8]">
            <span>נמוך</span>
            {['#F8F8FC', '#EDE9F8', '#D4CCEE', '#B5A9E0', '#7B6DC8'].map((c) => (
              <span key={c} className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: c }} />
            ))}
            <span>גבוה</span>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const pct = stat.total / maxSpend;
            const { bg, text } = getHeatColor(pct);
            const isCurrentMonth = stat.index === currentMonth;
            const savingsRate = stat.incomeTotal > 0 ? Math.round(((stat.incomeTotal - stat.total) / stat.incomeTotal) * 100) : null;

            return (
              <button
                key={stat.index}
                onClick={() => handleMonthClick(stat.index)}
                className={`rounded-xl p-3 text-right transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer border-2 ${
                  isCurrentMonth ? 'border-[#7B6DC8]' : 'border-transparent'
                }`}
                style={{ backgroundColor: bg }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium" style={{ color: text, opacity: 0.7 }}>
                    {isCurrentMonth ? '● ' : ''}{stat.name}
                  </span>
                  {stat.count > 0 && (
                    <span className="text-[9px] rounded-full px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.08)', color: text }}>
                      {stat.count}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold leading-tight" style={{ color: text }}>
                  {stat.total > 0 ? formatCurrency(stat.total) : '—'}
                </p>
                {savingsRate !== null && stat.total > 0 && (
                  <p className="text-[10px] mt-0.5 font-medium" style={{ color: text, opacity: 0.75 }}>
                    {savingsRate >= 0 ? `↑ ${savingsRate}% חיסכון` : `↓ גירעון`}
                  </p>
                )}
                {stat.total === 0 && stat.incomeTotal === 0 && (
                  <p className="text-[10px] text-[#C0C0D0] mt-0.5">אין נתונים</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">השוואה חודשית — הוצאות מול הכנסות</h2>
        <div className="flex items-end gap-1.5 h-32">
          {stats.map((stat) => {
            const maxVal = Math.max(maxSpend, Math.max(...stats.map((s) => s.incomeTotal)), 1);
            const expH = Math.round((stat.total / maxVal) * 100);
            const incH = Math.round((stat.incomeTotal / maxVal) * 100);
            const isCurrentMonth = stat.index === currentMonth;
            return (
              <button
                key={stat.index}
                onClick={() => handleMonthClick(stat.index)}
                className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer"
                title={`${stat.name}: הוצאות ${formatCurrency(stat.total)} | הכנסות ${formatCurrency(stat.incomeTotal)}`}
              >
                <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: 96 }}>
                  <div
                    className="flex-1 rounded-t-sm transition-all group-hover:opacity-80"
                    style={{ height: `${incH}%`, backgroundColor: '#5A9A42', opacity: 0.7 }}
                  />
                  <div
                    className={`flex-1 rounded-t-sm transition-all group-hover:opacity-80 ${isCurrentMonth ? 'ring-2 ring-[#7B6DC8] ring-offset-1' : ''}`}
                    style={{ height: `${expH}%`, backgroundColor: '#7B6DC8' }}
                  />
                </div>
                <span className={`text-[8px] ${isCurrentMonth ? 'text-[#7B6DC8] font-bold' : 'text-[#9090A8]'}`}>
                  {stat.name.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-[#6B6B8A]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#5A9A42] opacity-70" /> הכנסות</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-[#7B6DC8]" /> הוצאות</span>
        </div>
      </div>

      {familyMembers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">הוצאות לפי חבר משפחה</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {familyMembers.map((member) => {
              const memberTotal = stats.reduce((sum, stat) => {
                const md = months[stat.index];
                const memberExp = (md?.expenses ?? []).filter((e) => e.memberId === member.id && !e.isFuture && !e.isPending);
                return sum + memberExp.reduce((s, e) => s + e.amount, 0);
              }, 0);
              const pct = totalYearSpend > 0 ? Math.round((memberTotal / totalYearSpend) * 100) : 0;
              return (
                <div key={member.id} className="rounded-xl p-3 bg-lavender-light/40 border border-lavender/20">
                  <p className="text-sm font-semibold text-[#1E1E2E]">{member.name}</p>
                  <p className="text-lg font-bold text-[#5B52A0] mt-1">{formatCurrency(memberTotal)}</p>
                  <p className="text-xs text-[#9090A8]">{pct}% מסה&quot;כ ההוצאות</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
