import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewSalaryCard() {
  const { recurringIncomes } = useActiveBoardData();

  const totalRecurring = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const count = recurringIncomes.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💼 הכנסות קבועות</span>
        <NavLink to="/salary-slip" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← תלוש</NavLink>
      </div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">מקורות</span><span className="font-semibold">{count}</span></div>
      <div className="flex justify-between text-xs"><span className="text-[#9090A8]">סה״כ חודשי</span><span className="font-semibold text-sage-dark">{formatCurrency(totalRecurring)}</span></div>
      <div className="h-1.5 bg-sage-light rounded-full mt-1">
        <div className="h-1.5 bg-sage rounded-full" style={{ width: count > 0 ? '100%' : '0%' }} />
      </div>
      <p className="text-[10px] text-[#9090A8]">לניתוח תלוש מפורט ← תלוש שכר</p>
    </div>
  );
}
