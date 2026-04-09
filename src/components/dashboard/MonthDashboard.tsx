import { useState } from 'react';
import { HEBREW_MONTHS } from '../../config/months';
import { useFinanceStore } from '../../store/useFinanceStore';
import MonthSummary from '../month/MonthSummary';
import IncomeTable from '../month/IncomeTable';
import ExpenseBudgetSection from '../month/ExpenseBudgetSection';
import ExpenseCategoryBarChart from './ExpenseCategoryBarChart';

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider px-2">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export default function MonthDashboard() {
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const [monthIndex, setMonthIndex] = useState(currentMonthIndex);
  const year = useFinanceStore((s) => s.settings.year);

  const isCurrentMonth = monthIndex === currentMonthIndex && year === today.getFullYear();

  const hebrewDate = isCurrentMonth
    ? new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(today)
    : null;

  const prevMonth = () => setMonthIndex((i) => Math.max(0, i - 1));
  const nextMonth = () => setMonthIndex((i) => Math.min(11, i + 1));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">

      {/* ── Month Navigator ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="h-1 w-full bg-lavender-dark" />
        <div className="px-6 py-5" dir="ltr">
          <div className="flex items-center justify-center gap-6">
            {/* Previous month */}
            <button
              onClick={prevMonth}
              disabled={monthIndex === 0}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-lavender-light text-[#4A4A60] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="חודש קודם"
            >
              <ChevronLeftIcon />
            </button>

            {/* Month label */}
            <div className="text-center min-w-[180px]">
              <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight" dir="rtl">
                {HEBREW_MONTHS[monthIndex]} {year}
              </h1>
              {hebrewDate && (
                <p className="text-sm text-[#9090A8] mt-0.5" dir="rtl">{hebrewDate}</p>
              )}
            </div>

            {/* Next month */}
            <button
              onClick={nextMonth}
              disabled={monthIndex >= currentMonthIndex}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-lavender-light text-[#4A4A60] disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              aria-label="חודש הבא"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Month dots indicator */}
          <div className="flex justify-center gap-1.5 mt-4" dir="ltr">
            {HEBREW_MONTHS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => idx <= currentMonthIndex && setMonthIndex(idx)}
                className={`transition-all duration-150 rounded-full cursor-pointer ${
                  idx === monthIndex
                    ? 'w-4 h-2 bg-lavender-dark'
                    : idx <= currentMonthIndex
                    ? 'w-2 h-2 bg-lavender hover:bg-lavender-dark'
                    : 'w-2 h-2 bg-gray-200 cursor-not-allowed'
                }`}
                aria-label={HEBREW_MONTHS[idx]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <MonthSummary monthIndex={monthIndex} />

      {/* ── Income ── */}
      <SectionDivider label="הכנסות" />
      <IncomeTable monthIndex={monthIndex} />

      {/* ── Expenses ── */}
      <SectionDivider label="הוצאות" />
      <div className="mb-6">
        <ExpenseCategoryBarChart monthIndex={monthIndex} showToggle={false} />
      </div>
      <ExpenseBudgetSection monthIndex={monthIndex} />
    </div>
  );
}
