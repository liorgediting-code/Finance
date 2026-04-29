import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { HEBREW_MONTHS } from '../../config/months';
import { CATEGORIES } from '../../config/categories';

interface CalendarEvent {
  day: number;
  label: string;
  amount: number;
  type: 'recurring' | 'installment' | 'subscription';
  color: string;
}

const WEEKDAY_LABELS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

function extractDay(dateStr: string): number {
  if (!dateStr) return 1;
  const parts = dateStr.split('-');
  if (parts.length === 3) return parseInt(parts[2], 10) || 1;
  return 1;
}

export default function FinancialCalendarPage() {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { recurringExpenses } = useActiveBoardData();
  const { installments, settings } = useFinanceStore(
    useShallow((s) => ({ installments: s.installments, settings: s.settings }))
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const events: CalendarEvent[] = [];

  // Recurring expenses
  for (const exp of recurringExpenses) {
    const day = extractDay(exp.date);
    const cat = CATEGORIES.find((c) => c.id === exp.categoryId);
    events.push({
      day: Math.min(day, daysInMonth),
      label: exp.description || cat?.nameHe || 'הוצאה קבועה',
      amount: exp.amount,
      type: exp.cancelUrl ? 'subscription' : 'recurring',
      color: cat?.color ?? '#9090A8',
    });
  }

  // Installments active this month
  for (const inst of installments) {
    const instStartAbs = inst.startYear * 12 + inst.startMonth - 1;
    const viewAbs = viewYear * 12 + viewMonth;
    const instEnd = instStartAbs + inst.numPayments - 1;
    if (viewAbs >= instStartAbs && viewAbs <= instEnd) {
      const cat = CATEGORIES.find((c) => c.id === inst.categoryId);
      events.push({
        day: 1,
        label: inst.description,
        amount: inst.totalAmount / inst.numPayments,
        type: 'installment',
        color: cat?.color ?? '#7B6DC8',
      });
    }
  }

  const eventsByDay: Record<number, CalendarEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDay[ev.day]) eventsByDay[ev.day] = [];
    eventsByDay[ev.day].push(ev);
  }

  const totalMonth = events.reduce((s, e) => s + e.amount, 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells: Array<{ day: number | null }> = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });

  const isToday = (d: number) =>
    d === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();

  const typeLabel: Record<string, string> = {
    recurring: 'קבועה',
    subscription: 'מנוי',
    installment: 'תשלומים',
  };
  const typeColor: Record<string, string> = {
    recurring: 'bg-powder-light text-powder-dark',
    subscription: 'bg-blush-light text-blush-dark',
    installment: 'bg-lavender text-lavender-dark',
  };

  const year = settings.year;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 flex flex-col gap-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E1E2E]">לוח שנה פיננסי</h1>
        <div className="text-xs text-[#9090A8] bg-white rounded-xl shadow-sm px-3 py-1.5">
          סה"כ: <span className="font-bold text-blush-dark">{formatCurrency(totalMonth)}</span>
        </div>
      </div>

      {/* Month navigator */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-0.5 w-full bg-lavender-dark" />
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={nextMonth} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-[#4A4A60]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
          <h2 className="text-base font-bold text-[#1E1E2E]">{HEBREW_MONTHS[viewMonth]} {viewYear === now.getFullYear() ? year : viewYear}</h2>
          <button onClick={prevMonth} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer text-[#4A4A60]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-t border-gray-100" dir="ltr">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#9090A8] py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-gray-100" dir="ltr">
          {cells.map((cell, i) => {
            const dayEvents = cell.day ? (eventsByDay[cell.day] ?? []) : [];
            const today = cell.day ? isToday(cell.day) : false;
            return (
              <div
                key={i}
                className={`min-h-[72px] border-b border-l border-gray-50 p-1.5 ${!cell.day ? 'bg-gray-50/50' : ''}`}
              >
                {cell.day && (
                  <>
                    <span className={`text-xs font-medium inline-flex items-center justify-center w-5 h-5 rounded-full mb-1 ${today ? 'bg-lavender-dark text-white' : 'text-[#4A4A60]'}`}>
                      {cell.day}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((ev, j) => (
                        <div
                          key={j}
                          className="rounded px-1 py-0.5 text-[9px] font-medium truncate leading-tight"
                          style={{ backgroundColor: ev.color + '22', color: ev.color }}
                          title={`${ev.label} - ${formatCurrency(ev.amount)}`}
                        >
                          {ev.label}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[9px] text-[#9090A8] px-1">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
      {events.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-sage" />
          <div className="p-4">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">כל האירועים החודש</p>
            <div className="flex flex-col gap-2">
              {[...events]
                .sort((a, b) => a.day - b.day)
                .map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: ev.color }}>
                      {ev.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E1E2E] truncate">{ev.label}</p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${typeColor[ev.type]}`}>
                      {typeLabel[ev.type]}
                    </span>
                    <span className="text-sm font-bold text-blush-dark flex-shrink-0">{formatCurrency(ev.amount)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-sm font-medium text-[#4A4A60]">אין אירועים פיננסיים לחודש זה</p>
          <p className="text-xs text-[#9090A8] mt-1">הוסף הוצאות קבועות ותשלומים כדי לראות אותם בלוח השנה</p>
        </div>
      )}
    </div>
  );
}
