import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { Link } from 'react-router-dom';

function TrendIcon({ positive }: { positive: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      {positive
        ? <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
        : <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></>}
    </svg>
  );
}

export default function OverviewNetWorthCard() {
  const { savingsFunds, mortgages, debts, lifeGoals, savingsVehicles, installments } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsVehicles: s.savingsVehicles,
      installments: s.installments,
    }))
  );

  // Assets
  const savingsTotal = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
  const vehiclesTotal = savingsVehicles.reduce((s, v) => s + v.balance, 0);
  const goalsTotal = lifeGoals.reduce((s, g) => s + g.savedAmount, 0);
  const totalAssets = savingsTotal + vehiclesTotal + goalsTotal;

  // Liabilities
  const mortgageDebt = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0);
  const debtTotal = debts.reduce((s, d) => s + d.balance, 0);
  const installmentsRemaining = installments.reduce((s, inst) => {
    const remaining = inst.numPayments - inst.paidPayments;
    return s + (remaining * (inst.totalAmount / inst.numPayments));
  }, 0);
  const totalLiabilities = mortgageDebt + debtTotal + installmentsRemaining;

  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  return (
    <Link to="/month" className="block">
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">שווי נטו</span>
          <span className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-sage-dark' : 'text-blush-dark'}`}>
            <TrendIcon positive={isPositive} />
            {isPositive ? 'חיובי' : 'שלילי'}
          </span>
        </div>

        <div>
          <p className={`text-xl font-black ${isPositive ? 'text-sage-dark' : 'text-blush-dark'}`}>
            {formatCurrency(netWorth)}
          </p>
          <p className="text-[10px] text-[#9090A8] mt-0.5">נכסים פחות התחייבויות</p>
        </div>

        <div className="border-t border-gray-100 pt-2.5 flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-[#9090A8]">נכסים</span>
            <span className="font-medium text-sage-dark">{formatCurrency(totalAssets)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#9090A8]">התחייבויות</span>
            <span className="font-medium text-blush-dark">−{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>

        {/* Visual bar */}
        {(totalAssets > 0 || totalLiabilities > 0) && (
          <div className="h-1.5 rounded-full bg-blush-light overflow-hidden">
            <div
              className="h-full bg-sage-dark rounded-full transition-all"
              style={{ width: `${Math.min(100, totalAssets > 0 ? (totalAssets / (totalAssets + totalLiabilities)) * 100 : 0)}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
