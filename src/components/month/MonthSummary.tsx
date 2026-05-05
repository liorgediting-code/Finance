import { useActiveBoardData } from '../../store/useActiveBoardData';
import { sumAmounts, isEntryFuture } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../shared/StatCard';
import { computeMonthTotals } from '../../utils/monthlyTotals';

interface MonthSummaryProps {
  monthIndex: number;
}

function DeltaBadge({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
  if (previous === 0) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  const pct = Math.round(Math.abs(diff / previous) * 100);
  const positive = lowerIsBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  return (
    <span className={`text-[10px] sm:text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
      {sign}{formatCurrency(diff)} ({pct}%) לעומת חודש שעבר
    </span>
  );
}

export default function MonthSummary({ monthIndex }: MonthSummaryProps) {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const monthData = months[monthIndex];
  const prevMonthData = monthIndex > 0 ? months[monthIndex - 1] : undefined;

  const expenseEntries = monthData?.expenses ?? [];
  const incomeEntries = monthData?.income ?? [];
  const futureIncomeTotal = sumAmounts(incomeEntries.filter((e) => isEntryFuture(e)));
  const futureExpenseTotal = sumAmounts(expenseEntries.filter((e) => isEntryFuture(e)));

  // Pending transactions
  const pendingExpenses = expenseEntries.filter((e) => e.isPending);
  const pendingTotal = sumAmounts(pendingExpenses);
  const confirmedExpenses = expenseEntries.filter((e) => !e.isPending && !isEntryFuture(e));
  const confirmedTotal = sumAmounts(confirmedExpenses) + sumAmounts(recurringExpenses);

  const { totalIncome } = computeMonthTotals(monthData, recurringIncomes, recurringExpenses);
  // remaining uses confirmed expenses only (pending shown separately)
  const remaining = totalIncome - confirmedTotal;

  const overspending = confirmedTotal > totalIncome && totalIncome > 0;

  // vs last month
  const { totalIncome: prevIncome, totalExpenses: prevExpenses } = computeMonthTotals(
    prevMonthData,
    recurringIncomes,
    recurringExpenses,
  );

  const savingsPercent = totalIncome > 0 && remaining > 0
    ? Math.round((remaining / totalIncome) * 100)
    : 0;

  return (
    <div className="mb-8">
      {overspending && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700" dir="rtl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-medium">
            חריגה מהתקציב! הוצאת {formatCurrency(confirmedTotal - totalIncome)} יותר ממה שהכנסת החודש
          </span>
        </div>
      )}

      {pendingTotal > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-amber-700" dir="rtl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{pendingExpenses.length} עסקאות ממתינות — סה&quot;כ {formatCurrency(pendingTotal)} — טרם נגבו</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
        <StatCard
          title='סה"כ הכנסות'
          value={formatCurrency(totalIncome)}
          colorClass="bg-sage-light"
          accentColor="#5A9A42"
          subtitle={
            futureIncomeTotal > 0 || prevIncome > 0 ? (
              <>
                {futureIncomeTotal > 0 && (
                  <span className="text-amber-600 block">+ {formatCurrency(futureIncomeTotal)} צפוי להתקבל</span>
                )}
                {prevIncome > 0 && <DeltaBadge current={totalIncome} previous={prevIncome} />}
              </>
            ) : undefined
          }
        />
        <StatCard
          title='סה"כ הוצאות'
          value={formatCurrency(confirmedTotal)}
          colorClass="bg-blush-light"
          accentColor="#9B72C0"
          subtitle={
            futureExpenseTotal > 0 || prevExpenses > 0 ? (
              <>
                {futureExpenseTotal > 0 && (
                  <span className="text-amber-600 block">+ {formatCurrency(futureExpenseTotal)} צפוי לצאת</span>
                )}
                {prevExpenses > 0 && <DeltaBadge current={confirmedTotal} previous={prevExpenses} lowerIsBetter />}
              </>
            ) : undefined
          }
        />
        <StatCard
          title="יתרה"
          value={formatCurrency(remaining)}
          colorClass={remaining >= 0 ? 'bg-sage-light' : 'bg-blush-light'}
          accentColor={remaining >= 0 ? '#5A9A42' : '#9B72C0'}
          subtitle={remaining >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
        />
        <StatCard
          title="אחוז חיסכון"
          value={savingsPercent > 0 ? `${savingsPercent}%` : '—'}
          colorClass="bg-honey-light"
          accentColor="#C8A830"
          subtitle={savingsPercent > 0 ? (savingsPercent >= 20 ? 'מצוין! מעל 20%' : savingsPercent >= 10 ? 'טוב' : 'שאפו לחסוך יותר') : undefined}
        />
        {pendingTotal > 0 && (
          <StatCard
            title="ממתין לגבייה"
            value={formatCurrency(pendingTotal)}
            colorClass="bg-amber-50"
            accentColor="#C8A830"
            subtitle={`${pendingExpenses.length} עסקאות`}
          />
        )}
      </div>
    </div>
  );
}
