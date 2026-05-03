import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewSubscriptionCard() {
  const { recurringExpenses, months } = useActiveBoardData();

  const now = new Date();
  const currentMonthIdx = now.getMonth();

  const recurringBase = recurringExpenses.filter((e) => !e.linkedSourceId);
  const thisMonthRecurring = (months[currentMonthIdx]?.expenses ?? []).filter(
    (e) => e.isRecurring && !recurringBase.find((r) => r.id === e.id)
  );

  const allSubs = [...recurringBase, ...thisMonthRecurring];
  const monthlyTotal = allSubs.reduce((s, sub) => s + sub.amount, 0);

  return (
    <NavLink
      to="/subscription-audit"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#D8C0E8' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🔄</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">ביקורת מנויים</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">{formatCurrency(monthlyTotal)}/חודש</p>
        <p className="text-xs text-[#9090A8] mt-0.5">{formatCurrency(monthlyTotal * 12)}/שנה · {allSubs.length} מנויים →</p>
      </div>
    </NavLink>
  );
}
