import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { generateInsights } from '../../utils/insights';

export default function OverviewInsightsCard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { savingsFunds, mortgages, debts, lifeGoals, installments } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      installments: s.installments,
    }))
  );

  const insights = generateInsights({
    months, recurringIncomes, recurringExpenses,
    savingsFunds, mortgages, debts, lifeGoals, installments,
    currentMonth: new Date().getMonth(),
  });

  const danger  = insights.filter((i) => i.severity === 'danger').length;
  const warning = insights.filter((i) => i.severity === 'warning').length;
  const success = insights.filter((i) => i.severity === 'success').length;
  const top = insights[0];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">💡 תובנות חכמות</span>
        <NavLink to="/insights" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {insights.length === 0 ? (
        <p className="text-xs text-[#9090A8]">הוסף נתונים לקבלת תובנות</p>
      ) : (
        <>
          <div className="flex gap-2">
            {danger  > 0 && <span className="text-[10px] font-bold bg-blush-light text-blush-dark px-2 py-0.5 rounded-full">{danger} דורש טיפול</span>}
            {warning > 0 && <span className="text-[10px] font-bold bg-honey-light text-honey-dark px-2 py-0.5 rounded-full">{warning} שים לב</span>}
            {success > 0 && <span className="text-[10px] font-bold bg-sage-light text-sage-dark px-2 py-0.5 rounded-full">{success} חיובי</span>}
          </div>
          {top && (
            <p className="text-xs text-[#4A4A60] leading-snug line-clamp-2 border-t border-gray-50 pt-2">
              {top.title}
            </p>
          )}
        </>
      )}
    </div>
  );
}
