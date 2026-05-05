import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewDailyBudgetCard() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const { months, recurringExpenses } = useActiveBoardData();

  const now = new Date();
  const monthIndex = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), monthIndex + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - today + 1);

  const md = months[monthIndex];
  const budget = md?.budget ?? {};

  const totalBudget = Object.values(budget).reduce((s, v) => s + v, 0);

  const directExpenses = (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const recurringTotal = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSpent = directExpenses + recurringTotal;

  const remaining = totalBudget - totalSpent;
  const dailyAllowance = remaining / daysLeft;

  if (totalBudget === 0) return null;

  const isTight = dailyAllowance > 0 && dailyAllowance < 100;
  const isOver = dailyAllowance < 0;

  const accentColor = isOver ? '#E06060' : isTight ? '#F59E0B' : '#22C55E';
  const accentBg = isOver ? '#FEF2F2' : isTight ? '#FFFBEB' : '#F0FDF4';
  const emoji = isOver ? '⚠️' : isTight ? '⏳' : '✅';

  const pct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  const unusedYear = settings.year;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" aria-label="תקציב יומי">
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-4">
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
          📆 תקציב יומי — {unusedYear}
        </p>

        <div
          className="rounded-xl p-3 flex items-center justify-between mb-3"
          style={{ backgroundColor: accentBg }}
        >
          <div>
            <p className="text-[10px] text-[#9090A8] mb-0.5">נשאר ליום</p>
            <p className="text-2xl font-bold leading-none" style={{ color: accentColor }}>
              {isOver ? '-' : ''}{formatCurrency(Math.abs(dailyAllowance))}
            </p>
            <p className="text-[10px] text-[#9090A8] mt-1">{emoji} {daysLeft} ימים נותרו</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-[#9090A8] mb-0.5">נוצל</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{Math.round(pct)}%</p>
            <p className="text-[10px] text-[#9090A8]">{formatCurrency(totalSpent)}</p>
          </div>
        </div>

        {/* Budget progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, pct)}%`, backgroundColor: accentColor }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-[10px] text-[#9090A8]">הוצאה: {formatCurrency(totalSpent)}</p>
          <p className="text-[10px] text-[#9090A8]">תקציב: {formatCurrency(totalBudget)}</p>
        </div>

        {isOver && (
          <p className="text-[11px] text-red-500 mt-2 font-medium">
            חריגה מהתקציב — {formatCurrency(Math.abs(remaining))} מעל
          </p>
        )}
      </div>
    </div>
  );
}
