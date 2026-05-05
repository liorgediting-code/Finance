import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { HEBREW_MONTHS } from '../../config/months';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

interface GradeInfo {
  grade: Grade;
  color: string;
  bg: string;
  label: string;
}

function gradeInfo(grade: Grade): GradeInfo {
  const map: Record<Grade, GradeInfo> = {
    A: { grade: 'A', color: '#22C55E', bg: '#F0FDF4', label: 'מעולה' },
    B: { grade: 'B', color: '#4A90C0', bg: '#EFF6FF', label: 'טוב' },
    C: { grade: 'C', color: '#F59E0B', bg: '#FFFBEB', label: 'בסדר' },
    D: { grade: 'D', color: '#E06060', bg: '#FEF2F2', label: 'דורש שיפור' },
    F: { grade: 'F', color: '#DC2626', bg: '#FFF1F2', label: 'חריג' },
  };
  return map[grade];
}

function computeGrade(savingsRate: number, budgetAdherence: number, hasIncome: boolean): Grade {
  if (!hasIncome) return 'F';
  const score =
    (savingsRate >= 25 ? 40 : savingsRate >= 15 ? 30 : savingsRate >= 5 ? 20 : savingsRate > 0 ? 10 : 0) +
    (budgetAdherence >= 95 ? 35 : budgetAdherence >= 80 ? 25 : budgetAdherence >= 65 ? 15 : budgetAdherence >= 50 ? 8 : 0) +
    (savingsRate >= 10 ? 25 : savingsRate >= 5 ? 15 : 0);

  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

interface Criterion {
  label: string;
  value: string;
  pass: boolean;
}

export default function OverviewReportCardCard() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();

  const monthIndex = new Date().getMonth();
  const md = months[monthIndex];

  const income = [...(md?.income ?? []), ...recurringIncomes];
  const expenses = [...(md?.expenses ?? []), ...recurringExpenses];
  const budget = md?.budget ?? {};

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Budget adherence: % of budgeted categories within limit
  const budgetedCategories = Object.entries(budget).filter(([, b]) => b > 0);
  let withinBudget = 0;
  for (const [catId, budgetAmt] of budgetedCategories) {
    const spent = expenses.filter((e) => e.categoryId === catId).reduce((s, e) => s + e.amount, 0);
    if (spent <= budgetAmt) withinBudget++;
  }
  const budgetAdherence =
    budgetedCategories.length > 0 ? (withinBudget / budgetedCategories.length) * 100 : 100;

  const hasIncome = totalIncome > 0;
  const grade = computeGrade(savingsRate, budgetAdherence, hasIncome);
  const info = gradeInfo(grade);

  const criteria: Criterion[] = [
    {
      label: 'חיסכון חיובי',
      value: netSavings > 0 ? formatCurrency(netSavings) : `גירעון ${formatCurrency(Math.abs(netSavings))}`,
      pass: netSavings > 0,
    },
    {
      label: 'שיעור חיסכון',
      value: `${Math.round(savingsRate)}%`,
      pass: savingsRate >= 10,
    },
    {
      label: 'עמידה בתקציב',
      value: budgetedCategories.length > 0 ? `${Math.round(budgetAdherence)}%` : 'לא הוגדר תקציב',
      pass: budgetAdherence >= 75,
    },
    {
      label: 'הכנסה מוזנת',
      value: hasIncome ? formatCurrency(totalIncome) : 'לא הוזנה',
      pass: hasIncome,
    },
  ];

  const monthName = HEBREW_MONTHS[monthIndex] ?? '';

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" dir="rtl">
      <div className="h-1 w-full" style={{ backgroundColor: info.color }} />
      <div className="p-4">
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
          📋 כרטיס ציון — {monthName} {settings.year}
        </p>

        {/* Big grade display */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: info.bg }}
          >
            <span className="text-3xl font-black" style={{ color: info.color }}>
              {grade}
            </span>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1E1E2E]">{info.label}</p>
            <p className="text-xs text-[#9090A8]">
              {netSavings > 0
                ? `חסכת ${formatCurrency(netSavings)} החודש`
                : `הוצאות עולות על ההכנסות ב-${formatCurrency(Math.abs(netSavings))}`}
            </p>
          </div>
        </div>

        {/* Criteria breakdown */}
        <div className="space-y-1.5">
          {criteria.map((c) => (
            <div key={c.label} className="flex items-center justify-between py-1 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <span className={c.pass ? 'text-green-500' : 'text-red-400'}>
                  {c.pass ? '✓' : '✗'}
                </span>
                <span className="text-xs text-[#4A4A60]">{c.label}</span>
              </div>
              <span
                className="text-xs font-semibold"
                style={{ color: c.pass ? '#22C55E' : '#E06060' }}
              >
                {c.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
