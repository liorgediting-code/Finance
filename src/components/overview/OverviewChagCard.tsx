import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewChagCard() {
  const { chagBudgets, year } = useFinanceStore(
    useShallow((s) => ({ chagBudgets: s.chagBudgets, year: s.settings.year }))
  );

  const currentYear = chagBudgets.filter((c) => c.year === year);
  const nearest = currentYear[0];

  if (!nearest) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[#1E1E2E]">🕍 תקציב חג</span>
          <NavLink to="/chag-budget" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
        </div>
        <p className="text-xs text-[#9090A8]">אין תקציב חג לשנה זו</p>
      </div>
    );
  }

  const totalBudget = nearest.items.reduce((s, i) => s + i.budget, 0);
  const totalSpent = nearest.items.reduce((s, i) => s + i.spent, 0);
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🕍 תקציב חג</span>
        <NavLink to="/chag-budget" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <p className="text-xs font-semibold text-[#4A4A60]">{nearest.chagName} {nearest.year}</p>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">תקציב</span><span className="font-semibold">{formatCurrency(totalBudget)}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">הוצא</span><span className="font-semibold text-almond-dark">{formatCurrency(totalSpent)}</span></div>
      <div className="h-1.5 bg-almond-light rounded-full">
        <div className="h-1.5 bg-almond rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-[#9090A8]">נותר: {formatCurrency(remaining)}</p>
    </div>
  );
}
