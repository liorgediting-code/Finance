import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

function extractDay(dateStr: string): number {
  const parts = dateStr?.split('-');
  return parts?.length === 3 ? parseInt(parts[2], 10) || 1 : 1;
}

export default function OverviewPaydayCard() {
  const { recurringIncomes } = useActiveBoardData();

  const now = new Date();
  const today = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (recurringIncomes.length === 0) return null;

  // Find the soonest upcoming income day this month, or the earliest next month
  let minDaysAway = Infinity;
  let nextIncome: { label: string; amount: number; daysAway: number; day: number } | null = null;

  for (const inc of recurringIncomes) {
    const day = extractDay(inc.date);
    const daysAway = day >= today ? day - today : daysInMonth - today + day;
    if (daysAway < minDaysAway) {
      minDaysAway = daysAway;
      nextIncome = {
        label: inc.source || 'משכורת',
        amount: inc.amount,
        daysAway,
        day,
      };
    }
  }

  if (!nextIncome) return null;

  const { daysAway, label, amount, day } = nextIncome;

  const isToday = daysAway === 0;
  const isTomorrow = daysAway === 1;
  const isSoon = daysAway <= 3;

  const accentColor = isToday ? '#22C55E' : isSoon ? '#F59E0B' : '#7B6DC8';
  const accentBg = isToday ? '#F0FDF4' : isSoon ? '#FFFBEB' : '#F4F3FF';

  const countdownText = isToday
    ? '🎉 היום!'
    : isTomorrow
    ? 'מחר'
    : `עוד ${daysAway} ימים`;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-4">
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
          📅 ספירה לאחור למשכורת
        </p>

        <div
          className="rounded-xl p-3 flex items-center justify-between mb-3"
          style={{ backgroundColor: accentBg }}
        >
          <div>
            <p className="text-xs text-[#9090A8] mb-0.5 truncate max-w-[120px]">{label}</p>
            <p className="text-xl font-bold" style={{ color: accentColor }}>
              {countdownText}
            </p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-[#9090A8] mb-0.5">בתאריך {day} לחודש</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(amount)}</p>
          </div>
        </div>

        {recurringIncomes.length > 1 && (
          <p className="text-[11px] text-[#9090A8]">
            {recurringIncomes.length} מקורות הכנסה קבועים
          </p>
        )}
      </div>
    </div>
  );
}
