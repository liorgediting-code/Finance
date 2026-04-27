import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewInstallmentsCard() {
  const installments = useFinanceStore(useShallow((s) => s.installments));

  const now = new Date();
  const currentLinear = now.getFullYear() * 12 + now.getMonth();

  const active = installments.filter((inst) => {
    const start = inst.startYear * 12 + inst.startMonth - 1;
    const end = start + inst.numPayments - 1;
    return currentLinear >= start && currentLinear <= end;
  });

  const monthlyTotal = active.reduce((s, inst) => s + inst.totalAmount / inst.numPayments, 0);
  const totalRemaining = active.reduce((inst_s, inst) => {
    const start = inst.startYear * 12 + inst.startMonth - 1;
    const elapsed = currentLinear - start;
    const remaining = inst.numPayments - elapsed - 1;
    return inst_s + (remaining * inst.totalAmount / inst.numPayments);
  }, 0);

  const nextToFinish = active.slice().sort((a, b) => {
    const endA = a.startYear * 12 + a.startMonth - 1 + a.numPayments;
    const endB = b.startYear * 12 + b.startMonth - 1 + b.numPayments;
    return endA - endB;
  })[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">📦 תשלומים</span>
        <NavLink to="/installments" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">פעילים</span><span className="font-semibold">{active.length}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">תשלום חודשי</span><span className="font-semibold">{formatCurrency(monthlyTotal)}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">סה״כ נותר</span><span className="font-semibold text-blush-dark">{formatCurrency(totalRemaining)}</span></div>
      {nextToFinish && (
        <>
          <div className="h-px bg-gray-100" />
          <p className="text-[11px] text-[#9090A8]">הבא לסיום: {nextToFinish.description}</p>
        </>
      )}
      {active.length === 0 && <p className="text-xs text-[#9090A8]">אין תשלומים פעילים</p>}
    </div>
  );
}
