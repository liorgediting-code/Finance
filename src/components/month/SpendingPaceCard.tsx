import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
}

export default function SpendingPaceCard({ monthIndex }: Props) {
  const today = new Date();
  const year = useFinanceStore((s) => s.settings.year);
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();

  const isCurrentMonth = monthIndex === today.getMonth() && year === today.getFullYear();
  if (!isCurrentMonth) return null;

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  const md = months[monthIndex];
  const totalExpenses = sumAmounts([...recurringExpenses, ...(md?.expenses ?? [])]);
  const totalIncome = sumAmounts([...recurringIncomes, ...(md?.income ?? [])]);

  const dailyRate = dayOfMonth > 0 ? totalExpenses / dayOfMonth : 0;
  const projected = Math.round(dailyRate * daysInMonth);
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

  const projectedSavings = totalIncome - projected;
  const isOverBudget = projected > totalIncome && totalIncome > 0;
  const isWarning = !isOverBudget && totalIncome > 0 && projected > totalIncome * 0.92;

  const statusColor = isOverBudget ? '#EF4444' : isWarning ? '#F59E0B' : '#22C55E';
  const statusBg = isOverBudget ? '#FEF2F2' : isWarning ? '#FFFBEB' : '#F0FDF4';
  const statusText = isOverBudget
    ? 'צפוי לחרוג מהתקציב'
    : isWarning
    ? 'קרוב לגבול'
    : 'בקצב טוב';

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: statusColor }} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">קצב הוצאות</h3>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color: statusColor, backgroundColor: statusBg }}
          >
            {statusText}
          </span>
        </div>

        {/* Month progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-[#9090A8] mb-1">
            <span>יום {dayOfMonth} מתוך {daysInMonth}</span>
            <span>{daysRemaining} ימים נותרו</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${monthProgress}%`, backgroundColor: '#B0A8C8' }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] text-[#9090A8] mb-0.5">הוצאה יומית</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(Math.round(dailyRate))}</p>
          </div>
          <div className="rounded-lg p-2" style={{ backgroundColor: statusBg }}>
            <p className="text-[10px] text-[#9090A8] mb-0.5">תחזית חודש</p>
            <p className="text-sm font-bold" style={{ color: statusColor }}>{formatCurrency(projected)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-[10px] text-[#9090A8] mb-0.5">חיסכון צפוי</p>
            <p
              className="text-sm font-bold"
              dir="ltr"
              style={{ color: projectedSavings >= 0 ? '#22C55E' : '#EF4444' }}
            >
              {formatCurrency(projectedSavings)}
            </p>
          </div>
        </div>

        {totalIncome > 0 && (
          <p className="text-[11px] text-[#9090A8] mt-3 text-center">
            התחזית מבוססת על קצב ההוצאות מתחילת החודש
          </p>
        )}
      </div>
    </div>
  );
}
