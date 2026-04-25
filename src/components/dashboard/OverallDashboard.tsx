import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import StatCard from '../shared/StatCard';

interface Props {
  monthIndex: number;
}

interface BoardSummary {
  id: string;
  name: string;
  income: number;
  expenses: number;
  net: number;
}

export default function OverallDashboard({ monthIndex }: Props) {
  const months = useFinanceStore((s) => s.months);
  const recurringIncomes = useFinanceStore((s) => s.recurringIncomes);
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);
  const extraBoards = useFinanceStore((s) => s.extraBoards);

  const boards: BoardSummary[] = [
    {
      id: 'personal',
      name: 'אישי',
      income: sumAmounts(months[monthIndex]?.income ?? []) + sumAmounts(recurringIncomes),
      expenses: sumAmounts(months[monthIndex]?.expenses ?? []) + sumAmounts(recurringExpenses),
      net: 0,
    },
    ...extraBoards.map((b) => ({
      id: b.id,
      name: b.name,
      income: sumAmounts(b.months[monthIndex]?.income ?? []) + sumAmounts(b.recurringIncomes),
      expenses: sumAmounts(b.months[monthIndex]?.expenses ?? []) + sumAmounts(b.recurringExpenses),
      net: 0,
    })),
  ].map((b) => ({ ...b, net: b.income - b.expenses }));

  const totalIncome = boards.reduce((s, b) => s + b.income, 0);
  const totalExpenses = boards.reduce((s, b) => s + b.expenses, 0);
  const totalNet = totalIncome - totalExpenses;

  const incomeBreakdown = boards.map((b) => `${b.name} ${formatCurrency(b.income)}`).join(' + ');
  const expenseBreakdown = boards.map((b) => `${b.name} ${formatCurrency(b.expenses)}`).join(' + ');

  return (
    <div dir="rtl">
      {/* Combined summary cards */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <StatCard
            title='סה"כ הכנסות'
            value={formatCurrency(totalIncome)}
            colorClass="bg-sage-light"
            accentColor="#5A9A42"
            subtitle={boards.length > 1 ? incomeBreakdown : undefined}
          />
          <StatCard
            title='סה"כ הוצאות'
            value={formatCurrency(totalExpenses)}
            colorClass="bg-blush-light"
            accentColor="#9B72C0"
            subtitle={boards.length > 1 ? expenseBreakdown : undefined}
          />
          <StatCard
            title="יתרה"
            value={formatCurrency(totalNet)}
            colorClass={totalNet >= 0 ? 'bg-sage-light' : 'bg-blush-light'}
            accentColor={totalNet >= 0 ? '#5A9A42' : '#9B72C0'}
            subtitle={totalNet >= 0 ? 'במסגרת התקציב' : 'חריגה מהתקציב'}
          />
        </div>
      </div>

      {/* Per-board breakdown */}
      {boards.length > 1 && (
        <>
          <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-3">פירוט לפי לוח</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {boards.map((board) => (
              <div key={board.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-lavender-dark" />
                <div className="p-4">
                  <p className="text-sm font-semibold text-[#1E1E2E] mb-3">{board.name}</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-sage-light rounded-lg p-2">
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">הכנסות</p>
                      <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(board.income)}</p>
                    </div>
                    <div className="bg-blush-light rounded-lg p-2">
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">הוצאות</p>
                      <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(board.expenses)}</p>
                    </div>
                    <div className={`${board.net >= 0 ? 'bg-sage-light' : 'bg-blush-light'} rounded-lg p-2`}>
                      <p className="text-[10px] text-[#6B6B8A] mb-0.5">יתרה</p>
                      <p className={`text-sm font-bold ${board.net >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(board.net)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {boards.length === 1 && (
        <p className="text-sm text-[#9090A8] text-center py-8">
          הוסף לוח נוסף (כמו &quot;עסקי&quot;) מהתפריט הצדדי כדי לראות פירוט כאן
        </p>
      )}
    </div>
  );
}
