import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewCashflowCard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const monthlyNets = Object.values(months).map((md) => {
    const inc = recurringIncome + md.income.reduce((s, e) => s + e.amount, 0);
    const exp = recurringExpense + md.expenses.reduce((s, e) => s + e.amount, 0);
    return inc - exp;
  });

  const positiveCount = monthlyNets.filter((n) => n > 0).length;
  const avgNet = monthlyNets.length > 0 ? monthlyNets.reduce((s, v) => s + v, 0) / monthlyNets.length : 0;
  const worstMonth = monthlyNets.length > 0 ? Math.min(...monthlyNets) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💸 תזרים</span>
        <NavLink to="/cashflow" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">ממוצע חודשי</span>
        <span className={`font-semibold ${avgNet >= 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>{formatCurrency(avgNet)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">גרוע ביותר</span>
        <span className={`font-semibold ${worstMonth >= 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>{formatCurrency(worstMonth)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[#9090A8]">חודשים חיוביים</span>
        <span className="font-semibold">{positiveCount}/{monthlyNets.length}</span>
      </div>
      {monthlyNets.length === 0 && <p className="text-[11px] text-[#9090A8]">אין נתוני חודשים עדיין</p>}
    </div>
  );
}
