import { useState } from 'react';
import { HEBREW_MONTHS } from '../../config/months';
import SummaryCards from './SummaryCards';
import ExpensePieChart from './ExpensePieChart';
import IncomeExpenseChart from './IncomeExpenseChart';
import SavingsChart from './SavingsChart';
import SavingsGoal from './SavingsGoal';
import ExpenseCategoryBarChart from './ExpenseCategoryBarChart';

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
}

export default function DashboardPage() {
  const [monthIndex, setMonthIndex] = useState<number>(new Date().getMonth());

  return (
    <div className="space-y-8 p-4 md:p-6" dir="rtl">
      {/* Page header + month selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">לוח בקרה</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm text-[#6B6B8A] font-medium">
            חודש:
          </label>
          <select
            id="month-select"
            value={monthIndex}
            onChange={(e) => setMonthIndex(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors hover:border-lavender-dark"
          >
            {HEBREW_MONTHS.map((name, idx) => (
              <option key={idx} value={idx}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <section>
        <SectionHeading>סיכום חודשי</SectionHeading>
        <SummaryCards monthIndex={monthIndex} />
      </section>

      {/* Charts row */}
      <section>
        <SectionHeading>ניתוח הוצאות</SectionHeading>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ExpensePieChart monthIndex={monthIndex} />
          <IncomeExpenseChart />
        </div>
        <ExpenseCategoryBarChart monthIndex={monthIndex} />
      </section>

      {/* Savings chart */}
      <section>
        <SectionHeading>חיסכון שנתי</SectionHeading>
        <SavingsChart />
      </section>

      {/* Savings goals */}
      <section>
        <SectionHeading>יעדי חיסכון</SectionHeading>
        <SavingsGoal />
      </section>
    </div>
  );
}
