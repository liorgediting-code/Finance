import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '../../utils/formatters';

const ILS_RATES: Record<string, number> = {
  ILS: 1, USD: 3.70, EUR: 4.05, GBP: 4.80, CHF: 4.20,
  JPY: 0.025, CAD: 2.70, AUD: 2.40, AED: 1.00,
};

export default function OverviewInvestmentCard() {
  const portfolioItems = useFinanceStore(useShallow((s) => s.portfolioItems));
  const totalValueILS = portfolioItems.reduce((sum, p) => sum + p.currentValue * (ILS_RATES[p.currency] ?? 1), 0);
  const totalCostILS = portfolioItems.reduce((sum, p) =>
    p.purchasePrice != null ? sum + p.purchasePrice * (ILS_RATES[p.currency] ?? 1) : sum, 0);
  const gainPct = totalCostILS > 0 ? ((totalValueILS - totalCostILS) / totalCostILS) * 100 : null;

  return (
    <NavLink to="/investments" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: '#50A878' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">📈</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">תיק השקעות</p>
        {portfolioItems.length === 0 ? (
          <p className="text-sm text-[#1E1E2E] font-medium mt-1">הוסף נכסים לתיק</p>
        ) : (
          <>
            <p className="text-sm text-[#1E1E2E] font-medium mt-1">{formatCurrency(Math.round(totalValueILS))}</p>
            {gainPct != null && (
              <p className={`text-xs mt-0.5 ${gainPct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}% רווח/הפסד
              </p>
            )}
            {gainPct == null && <p className="text-xs text-[#9090A8] mt-0.5">{portfolioItems.length} נכסים</p>}
          </>
        )}
        <p className="text-xs text-[#50A878] mt-1">ניהול תיק →</p>
      </div>
    </NavLink>
  );
}
