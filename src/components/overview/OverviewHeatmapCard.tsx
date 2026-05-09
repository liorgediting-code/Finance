import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

function heatOpacity(pct: number): number {
  if (pct === 0) return 0.07;
  if (pct < 0.25) return 0.25;
  if (pct < 0.5)  return 0.5;
  if (pct < 0.75) return 0.72;
  return 1;
}

export default function OverviewHeatmapCard() {
  const { months, recurringExpenses } = useActiveBoardData();

  const monthTotals = useMemo(() => {
    const recurringExp = recurringExpenses.reduce((s, e) => s + e.amount, 0);
    return Array.from({ length: 12 }, (_, i) => {
      const md = months[i];
      if (!md) return 0;
      const monthlyExp = md.expenses.filter((e) => !e.isFuture && !e.isPending).reduce((s, e) => s + e.amount, 0);
      return monthlyExp + recurringExp;
    });
  }, [months, recurringExpenses]);

  const maxSpend = Math.max(...monthTotals, 1);
  const currentMonth = new Date().getMonth();
  const currentTotal = monthTotals[currentMonth];

  return (
    <NavLink
      to="/spending-heatmap"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#7B6DC8' }} />
      <div className="p-4">
        <div className="text-2xl mb-1">🌡️</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">מפת חום הוצאות</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">
          {currentTotal > 0 ? formatCurrency(currentTotal) : 'טרם נרשם'}
        </p>
        {/* Mini heatmap preview */}
        <div className="flex gap-0.5 mt-2">
          {monthTotals.map((total, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm h-4 ${i === currentMonth ? 'ring-1 ring-[#7B6DC8]' : ''}`}
              style={{
                backgroundColor: `rgba(123, 109, 200, ${heatOpacity(total / maxSpend)})`,
              }}
              title={MONTH_SHORT[i]}
            />
          ))}
        </div>
        <p className="text-xs text-[#9090A8] mt-1.5">השוואת עוצמת הוצאות →</p>
      </div>
    </NavLink>
  );
}
