import { CATEGORIES } from '../../config/categories';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
}

function getStatusColor(pct: number): { bg: string; bar: string; text: string } {
  if (pct >= 100) return { bg: 'bg-red-50 border-red-200', bar: 'bg-red-400', text: 'text-red-700' };
  if (pct >= 80)  return { bg: 'bg-amber-50 border-amber-200', bar: 'bg-amber-400', text: 'text-amber-700' };
  return { bg: 'bg-white border-gray-100', bar: 'bg-sage-dark', text: 'text-sage-dark' };
}

export default function BudgetEnvelopeView({ monthIndex }: Props) {
  const { months, recurringExpenses } = useActiveBoardData();
  const getRolled = useFinanceStore((s) => s.getRolledBudget);

  const md = months[monthIndex];
  const budget = md?.budget ?? {};
  const allExpenses = [...(md?.expenses ?? []), ...recurringExpenses.filter((e) => e.isRecurring)];

  // Collect categories with a budget
  const budgetedCats = CATEGORIES.filter((cat) => (budget[cat.id] ?? 0) > 0 || getRolled(monthIndex, cat.id) > 0);

  if (budgetedCats.length === 0) {
    return (
      <div className="text-center py-10 text-[#9090A8]" dir="rtl">
        <p className="text-3xl mb-2">📦</p>
        <p className="text-sm font-medium">אין תקציב מוגדר לחודש זה</p>
        <p className="text-xs mt-1">הגדר תקציב לקטגוריות כדי לראות תצוגת מעטפות</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" dir="rtl">
      {budgetedCats.map((cat) => {
        const budgeted = getRolled(monthIndex, cat.id);
        const spent = allExpenses
          .filter((e) => e.categoryId === cat.id && !e.isFuture && !e.isPending)
          .reduce((sum, e) => sum + e.amount, 0);
        const remaining = budgeted - spent;
        const pct = budgeted > 0 ? Math.min((spent / budgeted) * 100, 100) : 0;
        const { bg, bar, text } = getStatusColor(pct);

        return (
          <div
            key={cat.id}
            className={`rounded-xl border p-3 space-y-2 ${bg} transition-all`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs font-semibold text-[#1E1E2E] truncate">{cat.nameHe}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className={`text-base font-bold ${pct >= 100 ? 'text-red-600' : 'text-[#1E1E2E]'}`}>
                  {formatCurrency(spent)}
                </p>
                <p className="text-[10px] text-[#9090A8]">מתוך {formatCurrency(budgeted)}</p>
              </div>
              <div className="text-left">
                <p className={`text-xs font-semibold ${remaining < 0 ? 'text-red-600' : text}`}>
                  {remaining < 0 ? `חריגה ${formatCurrency(-remaining)}` : `נותר ${formatCurrency(remaining)}`}
                </p>
                <p className="text-[10px] text-[#9090A8]">{Math.round(pct)}%</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
