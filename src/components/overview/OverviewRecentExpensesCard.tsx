import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

function getCategoryColor(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.color ?? '#A0A0B0';
}

function getCategoryName(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.nameHe ?? categoryId;
}

export default function OverviewRecentExpensesCard() {
  const { months } = useActiveBoardData();
  const currentMonth = new Date().getMonth();

  const recentExpenses = useMemo(() => {
    const collected: Array<{
      id: string;
      date: string;
      label: string;
      amount: number;
      categoryId: string;
    }> = [];

    for (let offset = 0; offset <= 2; offset++) {
      const mIdx = currentMonth - offset;
      if (mIdx < 0) break;
      const md = months[mIdx];
      if (!md) continue;
      md.expenses.forEach((e) => {
        if (!e.isPending) {
          collected.push({
            id: e.id,
            date: e.date,
            label: e.description?.trim() || getCategoryName(e.categoryId),
            amount: e.amount,
            categoryId: e.categoryId,
          });
        }
      });
    }

    return collected
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [months, currentMonth]);

  return (
    <NavLink
      to="/month"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#B088D0' }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">הוצאות אחרונות</p>
          <span className="text-[10px] text-[#9090A8] hover:text-[#5B52A0]">לפרטים ←</span>
        </div>

        {recentExpenses.length === 0 ? (
          <p className="text-sm text-[#9090A8] text-center py-4">אין הוצאות עדיין</p>
        ) : (
          <div className="space-y-2.5">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-2.5">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(exp.categoryId) }}
                />
                <span className="flex-1 text-sm text-[#1E1E2E] truncate min-w-0">{exp.label}</span>
                <span className="text-[10px] text-[#9090A8] flex-shrink-0">{formatDate(exp.date)}</span>
                <span className="text-sm font-semibold text-[#4A4A60] flex-shrink-0 tabular-nums">
                  {formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </NavLink>
  );
}
