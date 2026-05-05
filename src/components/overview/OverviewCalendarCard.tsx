import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

function extractDay(dateStr: string): number {
  const parts = dateStr?.split('-');
  return parts?.length === 3 ? parseInt(parts[2], 10) || 1 : 1;
}

export default function OverviewCalendarCard() {
  const { recurringExpenses } = useActiveBoardData();
  const installments = useFinanceStore(useShallow((s) => s.installments));

  const now = new Date();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  interface Event { day: number; label: string; amount: number; color: string }
  const events: Event[] = [];

  for (const exp of recurringExpenses) {
    const day = extractDay(exp.date);
    const cat = CATEGORIES.find((c) => c.id === exp.categoryId);
    events.push({ day: Math.min(day, daysInMonth), label: exp.description || cat?.nameHe || 'הוצאה', amount: exp.amount, color: cat?.color ?? '#9090A8' });
  }

  const viewAbs = currentYear * 12 + currentMonth;
  for (const inst of installments) {
    const instStart = inst.startYear * 12 + inst.startMonth - 1;
    const instEnd = instStart + inst.numPayments - 1;
    if (viewAbs >= instStart && viewAbs <= instEnd) {
      events.push({ day: 1, label: inst.description, amount: inst.totalAmount / inst.numPayments, color: '#7B6DC8' });
    }
  }

  const upcoming = events
    .filter((e) => e.day >= today)
    .sort((a, b) => a.day - b.day)
    .slice(0, 3);

  const totalMonth = events.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">📅 לוח שנה פיננסי</span>
        <NavLink to="/calendar" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</NavLink>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-[#9090A8]">אין תשלומים מתוכננים</p>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {upcoming.map((ev, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: ev.color }}>
                    {ev.day}
                  </span>
                  <span className="text-xs text-[#4A4A60] flex-1 truncate">{ev.label}</span>
                  <span className="text-xs font-semibold text-blush-dark flex-shrink-0">{formatCurrency(ev.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#9090A8]">אין תשלומים שנותרו החודש</p>
          )}
          <div className="border-t border-gray-50 pt-1.5 flex justify-between text-xs">
            <span className="text-[#9090A8]">סה"כ החודש</span>
            <span className="font-semibold text-blush-dark">{formatCurrency(totalMonth)}</span>
          </div>
        </>
      )}
    </div>
  );
}
