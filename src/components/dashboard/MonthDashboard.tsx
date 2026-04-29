import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { HEBREW_MONTHS } from '../../config/months';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CATEGORIES, PAYMENT_METHODS } from '../../config/categories';
import { sumAmounts } from '../../utils/calculations';
import type { MonthData, IncomeEntry, ExpenseEntry } from '../../types';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import MonthSummary from '../month/MonthSummary';
import IncomeTable from '../month/IncomeTable';
import ExpenseBudgetSection from '../month/ExpenseBudgetSection';
import ExpenseCategoryBarChart from './ExpenseCategoryBarChart';
import SavingsPage from '../savings/SavingsPage';
import AnnualSummary from './AnnualSummary';
import OverallDashboard from './OverallDashboard';
import MonthComparison from '../month/MonthComparison';

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

function exportMonthCSV(
  monthIndex: number,
  boardMonths: Record<number, MonthData>,
  boardRecurringIncomes: IncomeEntry[],
  boardRecurringExpenses: ExpenseEntry[]
) {
  const state = useFinanceStore.getState();
  const md = boardMonths[monthIndex];
  const year = state.settings.year;
  const monthName = HEBREW_MONTHS[monthIndex];

  const allExpenses = [...boardRecurringExpenses, ...(md?.expenses ?? [])];
  const allIncome = [...boardRecurringIncomes, ...(md?.income ?? [])];

  const BOM = '\uFEFF';
  const lines: string[] = [];

  lines.push(`ייצוא ${monthName} ${year}`);
  lines.push('');

  // Income
  lines.push('--- הכנסות ---');
  lines.push('תאריך,מקור,בן משפחה,סכום,סוג');
  allIncome.forEach((e) => {
    const member = state.familyMembers.find((m) => m.id === e.memberId)?.name ?? '';
    lines.push(`${e.date},${e.source},${member},${e.amount},${e.isRecurring ? 'קבוע' : 'חד פעמי'}`);
  });
  lines.push(`,,סה"כ הכנסות,${sumAmounts(allIncome)},`);
  lines.push('');

  // Expenses
  lines.push('--- הוצאות ---');
  lines.push('תאריך,קטגוריה,תת-קטגוריה,תיאור,סכום,אמצעי תשלום,סוג');
  allExpenses.forEach((e) => {
    const catName = CATEGORIES.find((c) => c.id === e.categoryId)?.nameHe ?? e.categoryId;
    const subCat = e.categoryId === 'other' && e.customCategory?.trim()
      ? e.customCategory.trim()
      : CATEGORIES.find((c) => c.id === e.categoryId)?.subcategories.find((s) => s.id === e.subcategoryId)?.nameHe ?? '';
    const pay = PAYMENT_METHODS.find((m) => m.id === e.paymentMethod)?.nameHe ?? e.paymentMethod;
    lines.push(`${e.date},${catName},${subCat},${e.description},${e.amount},${pay},${e.isRecurring ? 'קבוע' : 'חד פעמי'}`);
  });
  lines.push(`,,,סה"כ הוצאות,${sumAmounts(allExpenses)},,`);

  const csv = BOM + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance_${monthName}_${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function MonthDashboard() {
  const today = new Date();
  const currentMonthIndex = today.getMonth();
  const [monthIndex, setMonthIndex] = useState(currentMonthIndex);
  const year = useFinanceStore((s) => s.settings.year);
  const activeBoardId = useFinanceStore((s) => s.activeBoardId);
  const hiddenSections = useFinanceStore(useShallow((s) => s.settings.hiddenDashboardSections ?? []));
  const enabledModules = useFinanceStore(useShallow((s) => s.settings.enabledModules ?? []));
  const visible = (section: string) => !hiddenSections.includes(section);
  const { months: boardMonths, recurringIncomes: boardRecurringIncomes, recurringExpenses: boardRecurringExpenses } = useActiveBoardData();

  const isCurrentMonth = monthIndex === currentMonthIndex && year === today.getFullYear();

  const hebrewDate = isCurrentMonth
    ? new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(today)
    : null;

  const user = useAuthStore((s) => s.user);
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';

  const prevMonth = () => setMonthIndex((i) => Math.max(0, i - 1));
  const nextMonth = () => setMonthIndex((i) => Math.min(11, i + 1));

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Back to overview */}
      <div className="mb-3 flex justify-end">
        <NavLink to="/" className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors flex items-center gap-1 cursor-pointer">
          מבט-על ←
        </NavLink>
      </div>

      {/* ── Greeting ── */}
      {displayName && (
        <p className="text-lg font-semibold text-[#1E1E2E] mb-4">
          היי {displayName} 👋
        </p>
      )}

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

          {/* Export button */}
          <div className="flex justify-center mt-3">
            <button
              onClick={() => exportMonthCSV(monthIndex, boardMonths, boardRecurringIncomes, boardRecurringExpenses)}
              className="flex items-center gap-1.5 text-xs text-[#6B6B8A] hover:text-[#1E1E2E] hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="ייצוא לאקסל"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              ייצוא CSV
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

      {activeBoardId === 'overall' ? (
        <OverallDashboard monthIndex={monthIndex} />
      ) : (
        <>
          {/* ── Summary Cards ── */}
          {visible('summary') && <MonthSummary monthIndex={monthIndex} />}

          {/* ── Expenses ── */}
          {visible('expenses') && (
            <>
              <SectionDivider label="הוצאות" />
              <div className="mb-6">
                <ExpenseCategoryBarChart monthIndex={monthIndex} showToggle={false} />
              </div>
              <ExpenseBudgetSection monthIndex={monthIndex} />
            </>
          )}

          {/* ── Income ── */}
          {visible('income') && (
            <>
              <SectionDivider label="הכנסות" />
              <IncomeTable monthIndex={monthIndex} />
            </>
          )}

          {/* ── Annual Summary ── */}
          {visible('annual') && (
            <>
              <SectionDivider label="סיכום שנתי" />
              <div className="mb-6">
                <AnnualSummary />
              </div>
            </>
          )}

          {/* ── Savings ── */}
          {visible('savings') && (
            <>
              <SectionDivider label="חסכונות" />
              <SavingsPage />
            </>
          )}

          {/* ── Month Comparison ── */}
          {enabledModules.includes('month-comparison') && monthIndex > 0 && (
            <>
              <SectionDivider label="השוואה חודשית" />
              <div className="mb-6">
                <MonthComparison monthIndex={monthIndex} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
