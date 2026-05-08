import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { HEBREW_MONTHS } from '../../config/months';
import { useFinanceStore } from '../../store/useFinanceStore';
import MonthSummary from './MonthSummary';
import IncomeTable from './IncomeTable';
import ExpenseBudgetSection from './ExpenseBudgetSection';
import BudgetAlertBanner from './BudgetAlertBanner';
import ShareSummaryModal from '../shared/ShareSummaryModal';

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default function MonthPage() {
  const { monthIndex } = useParams<{ monthIndex: string }>();
  const idx = Number(monthIndex);
  const year = useFinanceStore((s) => s.settings.year);
  const enabledModules = useFinanceStore((s) => s.settings.enabledModules ?? []);
  const showAlerts = enabledModules.includes('budget-alerts');
  const showShare = enabledModules.includes('share-summary');
  const [shareOpen, setShareOpen] = useState(false);

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthName} {year}
        </h2>
        {showShare && (
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-light text-lavender-dark text-xs font-semibold hover:bg-lavender hover:text-white transition-colors cursor-pointer"
          >
            <ShareIcon />
            שתף
          </button>
        )}
      </div>

      {showAlerts && <BudgetAlertBanner monthIndex={idx} />}
      <MonthSummary monthIndex={idx} />
      <IncomeTable monthIndex={idx} />
      <ExpenseBudgetSection monthIndex={idx} />

      {shareOpen && <ShareSummaryModal monthIndex={idx} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
