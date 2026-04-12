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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <StatCard
        title='סה"כ הכנסות'
        value={formatCurrency(totalIncome)}
        colorClass="bg-sage-light"
        accentColor="#A0B890"
      />
      <StatCard
        title='סה"כ הוצאות'
        value={formatCurrency(totalExpenses)}
        colorClass="bg-blush-light"
        accentColor="#D4A0A0"
      />
      <StatCard
        title="יתרה"
        value={formatCurrency(remaining)}
        colorClass={remaining >= 0 ? 'bg-sage-light' : 'bg-blush-light'}
        accentColor={remaining >= 0 ? '#A0B890' : '#D4A0A0'}
        subtitle={remaining >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
      />
    </div>
  );
}
