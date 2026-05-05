import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewDebtCard() {
  const { mortgages, debts, installments } = useFinanceStore(
    useShallow((s) => ({ mortgages: s.mortgages, debts: s.debts, installments: s.installments }))
  );

  const mortgageBalance = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0);
  const mortgagePayment = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.monthlyPayment, 0);
  const debtBalance = debts.reduce((s, d) => s + d.balance, 0);
  const debtPayment = debts.reduce((s, d) => s + d.minimumPayment, 0);
  const installmentsBalance = installments.reduce((s, inst) => {
    const remaining = inst.numPayments - inst.paidPayments;
    return s + remaining * (inst.totalAmount / inst.numPayments);
  }, 0);
  const installmentsPayment = installments.reduce(
    (s, inst) => s + inst.totalAmount / inst.numPayments,
    0,
  );
  const totalBalance = mortgageBalance + debtBalance + installmentsBalance;
  const totalPayment = mortgagePayment + debtPayment + installmentsPayment;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💳 חובות ומשכנתה</span>
        <NavLink to="/debt-planner" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {mortgages.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-[#4A4A60] mb-0.5">
            <span>משכנתה</span>
            <span className="font-semibold text-blush-dark">{formatCurrency(mortgageBalance)}</span>
          </div>
          {mortgages.flatMap((m) => m.tracks).map((track) => (
            <div key={track.id} className="flex justify-between text-xs text-[#9090A8]">
              <span>{track.type === 'prime' ? 'פריים' : track.type === 'fixed' ? 'קבועה' : track.type === 'cpi' ? 'צמודה' : 'משתנה'}</span>
              <span>{formatCurrency(track.balance)} • {track.remainingMonths} חודשים</span>
            </div>
          ))}
        </div>
      )}

      {debts.slice(0, 3).map((debt) => (
        <div key={debt.id} className="flex justify-between text-xs">
          <span className="text-[#6B6B8A]">{debt.name}</span>
          <span className="font-semibold text-almond-dark">{formatCurrency(debt.balance)}</span>
        </div>
      ))}

      {installments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-[#4A4A60] mb-0.5">
            <span>תשלומים בתשלומים</span>
            <span className="font-semibold text-almond-dark">{formatCurrency(installmentsBalance)}</span>
          </div>
          {installments.slice(0, 3).map((inst) => {
            const remaining = inst.numPayments - inst.paidPayments;
            return (
              <div key={inst.id} className="flex justify-between text-xs text-[#9090A8]">
                <span>{inst.description}</span>
                <span>{formatCurrency(remaining * (inst.totalAmount / inst.numPayments))} • {remaining} חודשים</span>
              </div>
            );
          })}
        </div>
      )}

      {(mortgages.length > 0 || debts.length > 0 || installments.length > 0) && (
        <>
          <div className="h-px bg-gray-100" />
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#9090A8]">סה״כ חוב</span>
              <span className="font-bold text-blush-dark">{formatCurrency(totalBalance)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9090A8]">תשלום חודשי</span>
              <span className="font-semibold text-[#4A4A60]">{formatCurrency(totalPayment)}</span>
            </div>
          </div>
        </>
      )}

      {mortgages.length === 0 && debts.length === 0 && installments.length === 0 && (
        <p className="text-xs text-[#9090A8]">אין חובות רשומים</p>
      )}
    </div>
  );
}
