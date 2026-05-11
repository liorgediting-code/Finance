import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { computeMonthTotals } from '../../utils/monthlyTotals';
import { HEBREW_MONTHS } from '../../config/months';

export default function AnnualBudgetPlanPage() {
  const year = useFinanceStore((s) => s.settings.year);
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const allBudgets = useFinanceStore(useShallow((s) => {
    const bd = s.activeBoardId === 'personal' || s.activeBoardId === 'overall'
      ? s.months
      : s.extraBoards.find((b) => b.id === s.activeBoardId)?.months ?? {};
    return Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [i, bd[i]?.budget ?? {}])
    );
  }));

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  type MonthRow = {
    index: number;
    name: string;
    budgetTotal: number;
    actualIncome: number;
    actualExpenses: number;
    net: number;
    isPast: boolean;
    isCurrent: boolean;
    isFuture: boolean;
  };

  const rows: MonthRow[] = Array.from({ length: 12 }, (_, i) => {
    const md = months[i];
    const totals = computeMonthTotals(md, i === currentMonth && year === currentYear ? recurringIncomes : [], i === currentMonth && year === currentYear ? recurringExpenses : []);
    const budgetEntries = allBudgets[i] ?? {};
    const budgetTotal = Object.values(budgetEntries).reduce((s, v) => s + (v as number), 0);
    const isPast = year < currentYear || (year === currentYear && i < currentMonth);
    const isCurrent = year === currentYear && i === currentMonth;
    return {
      index: i,
      name: HEBREW_MONTHS[i],
      budgetTotal,
      actualIncome: totals.totalIncome,
      actualExpenses: totals.totalExpenses,
      net: totals.net,
      isPast,
      isCurrent,
      isFuture: year > currentYear || (year === currentYear && i > currentMonth),
    };
  });

  const totalBudget = rows.reduce((s, r) => s + r.budgetTotal, 0);
  const totalIncome = rows.reduce((s, r) => s + r.actualIncome, 0);
  const totalExpenses = rows.reduce((s, r) => s + r.actualExpenses, 0);
  const totalNet = totalIncome - totalExpenses;

  const bestMonth = rows.reduce((best, r) => r.net > best.net ? r : best, rows[0]);
  const worstMonth = rows.reduce((worst, r) => {
    const hasData = r.actualIncome > 0 || r.actualExpenses > 0;
    const worstHasData = worst.actualIncome > 0 || worst.actualExpenses > 0;
    if (!hasData) return worst;
    if (!worstHasData) return r;
    return r.net < worst.net ? r : worst;
  }, rows[0]);

  const monthsWithData = rows.filter((r) => r.actualIncome > 0 || r.actualExpenses > 0).length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-[#1E1E2E]">תכנון תקציב שנתי {year}</h1>
        <p className="text-sm text-[#9090A8] mt-0.5">מבט-על על כל 12 החודשים — תוכנן מול בפועל</p>
      </div>

      {monthsWithData > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-[#9090A8] mb-1">סה&quot;כ הכנסות</p>
            <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(totalIncome)}</p>
            <p className="text-xs text-[#9090A8] mt-0.5">ב-{monthsWithData} חודשים</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-[#9090A8] mb-1">סה&quot;כ הוצאות</p>
            <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-[#9090A8] mb-1">נטו שנתי</p>
            <p className={`text-xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-[#9090A8] mb-1">תקציב שהוגדר</p>
            <p className="text-xl font-bold text-[#1E1E2E]">{totalBudget > 0 ? formatCurrency(totalBudget) : '—'}</p>
          </div>
        </div>
      )}

      {monthsWithData >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">החודש הטוב ביותר</p>
            <p className="text-lg font-bold text-green-800">{bestMonth.name}</p>
            <p className="text-sm text-green-700">+{formatCurrency(Math.max(0, bestMonth.net))}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs text-red-600 font-semibold uppercase tracking-wider mb-1">החודש המאתגר ביותר</p>
            <p className="text-lg font-bold text-red-700">{worstMonth.name}</p>
            <p className="text-sm text-red-600">{formatCurrency(worstMonth.net)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-[#1E1E2E]">פירוט חודשי</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A] w-24">חודש</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">הכנסות</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">הוצאות</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">תקציב</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">נטו</th>
                <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">מצב</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const overBudget = row.budgetTotal > 0 && row.actualExpenses > row.budgetTotal;
                const hasData = row.actualIncome > 0 || row.actualExpenses > 0;
                return (
                  <tr
                    key={row.index}
                    className={`border-b border-gray-50 transition-colors ${row.isCurrent ? 'bg-lavender/10' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.isCurrent && <span className="w-2 h-2 bg-lavender-dark rounded-full flex-shrink-0" />}
                        <span className={`font-medium ${row.isCurrent ? 'text-lavender-dark' : 'text-[#1E1E2E]'}`}>
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-green-700 font-medium">
                      {hasData ? formatCurrency(row.actualIncome) : <span className="text-[#9090A8]">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-medium ${overBudget ? 'text-red-600' : hasData ? 'text-[#1E1E2E]' : 'text-[#9090A8]'}`}>
                      {hasData ? formatCurrency(row.actualExpenses) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#6B6B8A]">
                      {row.budgetTotal > 0 ? formatCurrency(row.budgetTotal) : <span className="text-[#9090A8]">—</span>}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${!hasData ? 'text-[#9090A8]' : row.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {hasData ? `${row.net >= 0 ? '+' : ''}${formatCurrency(row.net)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {!hasData ? (
                        <span className="text-xs text-[#9090A8] bg-gray-100 px-2 py-0.5 rounded-full">
                          {row.isFuture ? 'עתידי' : 'אין נתונים'}
                        </span>
                      ) : overBudget ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">חריגה</span>
                      ) : row.net >= 0 ? (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">חיובי</span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">גירעון</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {monthsWithData > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-4 py-3 font-bold text-[#1E1E2E]">סה&quot;כ</td>
                  <td className="px-4 py-3 font-bold text-green-700">{formatCurrency(totalIncome)}</td>
                  <td className="px-4 py-3 font-bold text-[#1E1E2E]">{formatCurrency(totalExpenses)}</td>
                  <td className="px-4 py-3 font-bold text-[#6B6B8A]">{totalBudget > 0 ? formatCurrency(totalBudget) : '—'}</td>
                  <td className={`px-4 py-3 font-bold text-lg ${totalNet >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {monthsWithData === 0 && (
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-[#1E1E2E] font-medium">עוד אין נתונים לשנת {year}</p>
          <p className="text-sm text-[#9090A8] mt-1">הוסף הכנסות והוצאות בלוח החודשי וחזור לכאן לראות את התמונה השנתית</p>
        </div>
      )}
    </div>
  );
}
