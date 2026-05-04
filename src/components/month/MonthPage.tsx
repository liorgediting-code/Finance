import { useParams } from 'react-router-dom';
import { HEBREW_MONTHS } from '../../config/months';
import { useFinanceStore } from '../../store/useFinanceStore';
import MonthSummary from './MonthSummary';
import IncomeTable from './IncomeTable';
import ExpenseBudgetSection from './ExpenseBudgetSection';
import BudgetAlertBanner from './BudgetAlertBanner';

export default function MonthPage() {
  const { monthIndex } = useParams<{ monthIndex: string }>();
  const idx = Number(monthIndex);
  const year = useFinanceStore((s) => s.settings.year);
  const enabledModules = useFinanceStore((s) => s.settings.enabledModules ?? []);
  const showAlerts = enabledModules.includes('budget-alerts');

  if (isNaN(idx) || idx < 0 || idx > 11) {
    return (
      <div className="p-6 text-center text-gray-500">
        חודש לא תקין
      </div>
    );
  }

  const monthName = HEBREW_MONTHS[idx];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {monthName} {year}
      </h2>

      {showAlerts && <BudgetAlertBanner monthIndex={idx} />}
      <MonthSummary monthIndex={idx} />
      <IncomeTable monthIndex={idx} />
      <ExpenseBudgetSection monthIndex={idx} />
    </div>
  );
}
