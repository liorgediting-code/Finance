import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function NetWorthCard() {
  const { savingsFunds, savingsVehicles, mortgages, debts, settings } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      savingsVehicles: s.savingsVehicles,
      mortgages: s.mortgages,
      debts: s.debts,
      settings: s.settings,
    }))
  );

  if ((settings.hiddenDashboardSections ?? []).includes('net-worth')) return null;

  const savingsFundsTotal = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
  const vehiclesTotal = savingsVehicles.reduce((s, v) => s + v.balance, 0);
  const mortgageTotal = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0);
  const debtTotal = debts.reduce((s, d) => s + d.balance, 0);

  const assets = savingsFundsTotal + vehiclesTotal;
  const liabilities = mortgageTotal + debtTotal;
  const netWorth = assets - liabilities;

  const isPositive = netWorth >= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-base">💎</span>
        <span className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">שווי נטו</span>
      </div>

      <div className={`text-2xl font-bold ${isPositive ? 'text-[#3A7A3A]' : 'text-[#9A3A3A]'}`}>
        {formatCurrency(netWorth)}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] text-[#9090A8]">נכסים</span>
          <span className="text-xs font-semibold text-[#3A7A3A]">+{formatCurrency(assets)}</span>
        </div>
        {savingsFundsTotal > 0 && (
          <div className="flex justify-between items-center pr-3">
            <span className="text-[10px] text-[#B0B0C0]">קרנות חיסכון</span>
            <span className="text-[10px] text-[#6B6B8A]">{formatCurrency(savingsFundsTotal)}</span>
          </div>
        )}
        {vehiclesTotal > 0 && (
          <div className="flex justify-between items-center pr-3">
            <span className="text-[10px] text-[#B0B0C0]">פנסיה וחסכונות</span>
            <span className="text-[10px] text-[#6B6B8A]">{formatCurrency(vehiclesTotal)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-gray-50 pt-1.5">
          <span className="text-[11px] text-[#9090A8]">התחייבויות</span>
          <span className="text-xs font-semibold text-[#9A3A3A]">-{formatCurrency(liabilities)}</span>
        </div>
        {mortgageTotal > 0 && (
          <div className="flex justify-between items-center pr-3">
            <span className="text-[10px] text-[#B0B0C0]">משכנתה</span>
            <span className="text-[10px] text-[#6B6B8A]">{formatCurrency(mortgageTotal)}</span>
          </div>
        )}
        {debtTotal > 0 && (
          <div className="flex justify-between items-center pr-3">
            <span className="text-[10px] text-[#B0B0C0]">הלוואות וחובות</span>
            <span className="text-[10px] text-[#6B6B8A]">{formatCurrency(debtTotal)}</span>
          </div>
        )}
      </div>

      {assets === 0 && liabilities === 0 && (
        <p className="text-[11px] text-[#9090A8] mt-1">
          הוסף קרנות חיסכון, פנסיה וחובות כדי לחשב את השווי הנטו שלך
        </p>
      )}
    </div>
  );
}
