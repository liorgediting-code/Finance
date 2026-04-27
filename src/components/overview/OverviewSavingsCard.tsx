import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsVehicleType } from '../../types';

const VEHICLE_NAMES: Record<SavingsVehicleType, string> = {
  keren_hishtalmut: 'קרן השתלמות',
  pension: 'פנסיה',
  kupat_gemel: 'קופ״ג',
  child_savings: 'חסכון ילדים',
};

export default function OverviewSavingsCard() {
  const { savingsFunds, savingsVehicles } = useFinanceStore(
    useShallow((s) => ({ savingsFunds: s.savingsFunds, savingsVehicles: s.savingsVehicles }))
  );

  const vehicleTotals = savingsVehicles.reduce<Record<string, number>>((acc, v) => {
    acc[v.type] = (acc[v.type] ?? 0) + v.balance;
    return acc;
  }, {});

  const totalSaved = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
  const totalTarget = savingsFunds.reduce((s, f) => s + f.targetAmount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🏦 חיסכון וכלי חיסכון</span>
        <NavLink to="/savings-vehicles" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {savingsFunds.length > 0 ? (
        <div className="flex flex-col gap-2">
          {savingsFunds.slice(0, 3).map((fund) => {
            const pct = fund.targetAmount > 0 ? Math.min(100, (fund.savedAmount / fund.targetAmount) * 100) : 0;
            return (
              <div key={fund.id}>
                <div className="flex justify-between text-xs text-[#4A4A60] mb-1">
                  <span>{fund.name}</span>
                  <span className="text-[#9090A8]">{formatCurrency(fund.savedAmount)} / {formatCurrency(fund.targetAmount)}</span>
                </div>
                <div className="h-1.5 bg-sage-light rounded-full">
                  <div className="h-1.5 bg-sage rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {savingsFunds.length > 3 && (
            <span className="text-xs text-[#9090A8]">+{savingsFunds.length - 3} קרנות נוספות • סה״כ: {formatCurrency(totalSaved)} / {formatCurrency(totalTarget)}</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#9090A8]">אין קרנות חיסכון</p>
      )}

      {Object.keys(vehicleTotals).length > 0 && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="flex flex-col gap-1.5">
            {(Object.entries(vehicleTotals) as [SavingsVehicleType, number][]).map(([type, total]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="text-[#6B6B8A]">{VEHICLE_NAMES[type]}</span>
                <span className="font-semibold text-powder-dark">{formatCurrency(total)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
