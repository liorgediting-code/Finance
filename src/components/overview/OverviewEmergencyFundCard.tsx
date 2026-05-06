import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

function avgMonthlyExp(months: Record<number, { expenses: { amount: number }[] }>, recurring: { amount: number }[]): number {
  const populated = Object.values(months).filter((m) => m.expenses.length > 0);
  if (populated.length === 0) return recurring.reduce((s, e) => s + e.amount, 0);
  const total = populated.reduce((s, m) => s + m.expenses.reduce((es, e) => es + e.amount, 0), 0);
  return Math.round(total / populated.length);
}

export default function OverviewEmergencyFundCard() {
  const { savingsFunds, settings, months, recurringExpenses } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      settings: s.settings,
      months: s.months,
      recurringExpenses: s.recurringExpenses,
    }))
  );

  const fund = savingsFunds.find((f) => f.id === settings.emergencyFundId);
  const avg = avgMonthlyExp(months, recurringExpenses);
  const months6 = avg * 6;
  const covered = fund && avg > 0 ? fund.savedAmount / avg : 0;
  const pct = Math.min(100, months6 > 0 && fund ? (fund.savedAmount / months6) * 100 : 0);

  const accentColor = covered >= 6 ? '#5A9A42' : covered >= 3 ? '#C89E50' : '#4AACAC';

  return (
    <NavLink to="/emergency-fund" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-4">
        <div className="text-2xl mb-2">🛡️</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">קרן חירום</p>
        {fund ? (
          <>
            <p className="text-sm font-bold text-[#1E1E2E] mt-1">{formatCurrency(fund.savedAmount)}</p>
            <p className="text-xs text-[#9090A8] mt-0.5">{covered.toFixed(1)} חודשי כיסוי</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
            </div>
          </>
        ) : (
          <p className="text-xs text-[#9090A8] mt-1">הגדר קרן חירום →</p>
        )}
      </div>
    </NavLink>
  );
}
