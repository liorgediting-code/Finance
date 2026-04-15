import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts, calcRemaining } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../shared/StatCard';

interface MonthSummaryProps {
  monthIndex: number;
}

export default function MonthSummary({ monthIndex }: MonthSummaryProps) {
  const monthData = useFinanceStore((s) => s.months[monthIndex]);
  const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);

  const incomeEntries = monthData?.income ?? [];
  const expenseEntries = monthData?.expenses ?? [];

  const totalIncome = sumAmounts(incomeEntries) + sumAmounts(recurringIncomes);
  const totalExpenses = sumAmounts(expenseEntries) + sumAmounts(recurringExpenses);
  const remaining = calcRemaining(totalIncome, totalExpenses);

  const overspending = totalExpenses > totalIncome && totalIncome > 0;

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
            חריגה מהתקציב! הוצאת {formatCurrency(totalExpenses - totalIncome)} יותר ממה שהכנסת החודש
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title='סה"כ הכנסות'
          value={formatCurrency(totalIncome)}
          colorClass="bg-sage-light"
          accentColor="#5A9A42"
        />
        <StatCard
          title='סה"כ הוצאות'
          value={formatCurrency(totalExpenses)}
          colorClass="bg-blush-light"
          accentColor="#9B72C0"
          subtitle={overspending ? `חריגה של ${formatCurrency(totalExpenses - totalIncome)}` : undefined}
        />
        <StatCard
          title="יתרה"
          value={formatCurrency(remaining)}
          colorClass={remaining >= 0 ? 'bg-sage-light' : 'bg-blush-light'}
          accentColor={remaining >= 0 ? '#5A9A42' : '#9B72C0'}
          subtitle={remaining >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
        />
      </div>
    </div>
  );
}
