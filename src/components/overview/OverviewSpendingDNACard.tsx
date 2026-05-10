import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function OverviewSpendingDNACard() {
  const { months } = useActiveBoardData();

  const { peakDay, totalCount } = useMemo(() => {
    const totals = Array(7).fill(0) as number[];
    let count = 0;
    Object.values(months).forEach((md) => {
      if (!md) return;
      md.expenses.forEach((e) => {
        if (!e.isPending && !e.isFuture && e.date) {
          const d = new Date(e.date);
          if (!isNaN(d.getTime())) {
            totals[d.getDay()] += e.amount;
            count++;
          }
        }
      });
    });
    const maxIdx = totals.indexOf(Math.max(...totals));
    return { peakDay: totals[maxIdx] > 0 ? { name: DAY_NAMES[maxIdx], total: totals[maxIdx] } : null, totalCount: count };
  }, [months]);

  return (
    <NavLink to="/spending-dna" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#C870D8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🧬</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">DNA של הוצאות</p>
        {peakDay ? (
          <>
            <p className="text-sm text-[#1E1E2E] font-medium mt-1">שיא: יום {peakDay.name}</p>
            <p className="text-xs text-[#9090A8] mt-0.5">{formatCurrency(Math.round(peakDay.total))} · {totalCount} עסקאות</p>
          </>
        ) : (
          <p className="text-sm text-[#1E1E2E] font-medium mt-1">גלה דפוסי הוצאה</p>
        )}
        <p className="text-xs text-[#C870D8] mt-1">ראה ניתוח →</p>
      </div>
    </NavLink>
  );
}
