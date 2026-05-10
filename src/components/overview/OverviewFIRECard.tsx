import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { computeMonthTotals } from '../../utils/monthlyTotals';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewFIRECard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const savingsFunds = useFinanceStore(useShallow((s) => s.savingsFunds));
  const savingsVehicles = useFinanceStore(useShallow((s) => s.savingsVehicles));

  const currentSavings = useMemo(() =>
    savingsFunds.reduce((s, f) => s + f.savedAmount, 0) +
    savingsVehicles.reduce((s, v) => s + v.balance, 0),
  [savingsFunds, savingsVehicles]);

  const avgExpenses = useMemo(() => {
    const cm = new Date().getMonth();
    const samples: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const mi = ((cm - i) + 12) % 12;
      const md = months[mi];
      if (!md) continue;
      const t = computeMonthTotals(md, recurringIncomes, recurringExpenses);
      if (t.totalExpenses > 0) samples.push(t.totalExpenses);
    }
    return samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
  }, [months, recurringIncomes, recurringExpenses]);

  const nestEgg = avgExpenses > 0 ? avgExpenses * 12 * 25 : 0;
  const pct = nestEgg > 0 && currentSavings > 0 ? Math.min(100, (currentSavings / nestEgg) * 100) : 0;

  return (
    <NavLink to="/fire-calculator" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#E8C840' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🔥</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">עצמאות כלכלית (FIRE)</p>
        {nestEgg > 0 ? (
          <>
            <p className="text-sm text-[#1E1E2E] font-medium mt-1">{pct.toFixed(1)}% מהיעד</p>
            <p className="text-xs text-[#9090A8] mt-0.5">
              {formatCurrency(Math.round(currentSavings))} מתוך {formatCurrency(Math.round(nestEgg))}
            </p>
          </>
        ) : (
          <p className="text-sm text-[#1E1E2E] font-medium mt-1">חשב מסלול לפרישה מוקדמת</p>
        )}
        <p className="text-xs mt-1" style={{ color: '#E8C840' }}>לחשבון FIRE →</p>
      </div>
    </NavLink>
  );
}
