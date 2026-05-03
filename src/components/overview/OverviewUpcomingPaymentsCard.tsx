import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewUpcomingPaymentsCard() {
  const { recurringExpenses } = useActiveBoardData();
  const installments = useFinanceStore(useShallow((s) => s.installments));

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const recurringTotal = recurringExpenses
    .filter((e) => e.linkedSourceType !== 'installment')
    .reduce((s, e) => s + e.amount, 0);

  const targetLinear = currentYear * 12 + currentMonthIdx;
  const installmentsTotal = installments
    .filter((inst) => {
      const instStart = inst.startYear * 12 + inst.startMonth - 1;
      const instEnd = instStart + inst.numPayments - 1;
      return targetLinear >= instStart && targetLinear <= instEnd;
    })
    .reduce((s, inst) => s + inst.totalAmount / inst.numPayments, 0);

  const total = recurringTotal + installmentsTotal;
  const count =
    recurringExpenses.filter((e) => e.linkedSourceType !== 'installment').length +
    installments.filter((inst) => {
      const instStart = inst.startYear * 12 + inst.startMonth - 1;
      const instEnd = instStart + inst.numPayments - 1;
      return targetLinear >= instStart && targetLinear <= instEnd;
    }).length;

  return (
    <NavLink
      to="/upcoming-payments"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full" style={{ backgroundColor: '#B8CCE0' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">📅</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">תשלומים צפויים</p>
        <p className="text-sm text-[#1E1E2E] font-medium mt-1">{formatCurrency(total)}</p>
        <p className="text-xs text-[#9090A8] mt-0.5">{count} תשלומים החודש →</p>
      </div>
    </NavLink>
  );
}
