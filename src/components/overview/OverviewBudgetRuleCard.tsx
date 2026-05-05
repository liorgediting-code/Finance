import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

// 50/30/20 category mapping
const NEEDS_CATEGORIES = ['home', 'food', 'transport', 'health', 'financial', 'education'];
const SAVINGS_CATEGORIES = ['savings', 'investments'];
// Everything else = wants

interface RuleSection {
  label: string;
  emoji: string;
  target: number;
  actual: number;
  color: string;
  bg: string;
}

export default function OverviewBudgetRuleCard() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();

  const monthIndex = new Date().getMonth();
  const md = months[monthIndex];

  const expenses = [...(md?.expenses ?? []), ...recurringExpenses];
  const incomes = [...(md?.income ?? []), ...recurringIncomes];

  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  if (totalIncome === 0) return null;

  const needsTotal = expenses
    .filter((e) => NEEDS_CATEGORIES.includes(e.categoryId))
    .reduce((s, e) => s + e.amount, 0);

  const savingsTotal = expenses
    .filter((e) => SAVINGS_CATEGORIES.includes(e.categoryId))
    .reduce((s, e) => s + e.amount, 0);

  const wantsTotal = expenses
    .filter((e) => !NEEDS_CATEGORIES.includes(e.categoryId) && !SAVINGS_CATEGORIES.includes(e.categoryId))
    .reduce((s, e) => s + e.amount, 0);

  const sections: RuleSection[] = [
    {
      label: 'צרכים (50%)',
      emoji: '🏠',
      target: 50,
      actual: totalIncome > 0 ? (needsTotal / totalIncome) * 100 : 0,
      color: '#4A90C0',
      bg: '#EFF6FF',
    },
    {
      label: 'רצונות (30%)',
      emoji: '🎭',
      target: 30,
      actual: totalIncome > 0 ? (wantsTotal / totalIncome) * 100 : 0,
      color: '#7B6DC8',
      bg: '#F4F3FF',
    },
    {
      label: 'חיסכון (20%)',
      emoji: '💰',
      target: 20,
      actual: totalIncome > 0 ? (savingsTotal / totalIncome) * 100 : 0,
      color: '#22C55E',
      bg: '#F0FDF4',
    },
  ];

  const overallGrade = sections.every((s) => Math.abs(s.actual - s.target) < 10)
    ? 'טוב מאוד'
    : sections.filter((s) => Math.abs(s.actual - s.target) >= 15).length >= 2
    ? 'דורש שיפור'
    : 'סביר';

  const unusedYear = settings.year;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" dir="rtl">
      <div className="h-1 w-full bg-gradient-to-r from-[#4A90C0] via-[#7B6DC8] to-[#22C55E]" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">
            ⚖️ כלל 50/30/20 — {unusedYear}
          </p>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              overallGrade === 'טוב מאוד'
                ? 'bg-green-100 text-green-700'
                : overallGrade === 'סביר'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-600'
            }`}
          >
            {overallGrade}
          </span>
        </div>

        <div className="space-y-3">
          {sections.map((sec) => {
            const isOver = sec.actual > sec.target + 5;
            const isUnder = sec.actual < sec.target - 5;
            const barWidth = Math.min(100, sec.actual);
            const targetBarPos = Math.min(100, sec.target);

            return (
              <div key={sec.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{sec.emoji}</span>
                    <p className="text-xs font-medium text-[#1E1E2E]">{sec.label}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold" style={{ color: sec.color }}>
                      {Math.round(sec.actual)}%
                    </p>
                    {isOver && <span className="text-[10px] text-red-500">↑ גבוה</span>}
                    {isUnder && sec.label.includes('חיסכון') && (
                      <span className="text-[10px] text-orange-500">↓ נמוך</span>
                    )}
                  </div>
                </div>

                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 right-0 h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: isOver ? '#E06060' : sec.color }}
                  />
                  {/* Target marker */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-400 opacity-60"
                    style={{ right: `${targetBarPos}%` }}
                  />
                </div>

                <div className="flex justify-between mt-0.5">
                  <p className="text-[10px] text-[#9090A8]">
                    {formatCurrency(
                      sec.label.includes('צרכים')
                        ? needsTotal
                        : sec.label.includes('חיסכון')
                        ? savingsTotal
                        : wantsTotal
                    )}
                  </p>
                  <p className="text-[10px] text-[#9090A8]">יעד: {sec.target}%</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-[#9090A8] mt-3 text-center">
          מבוסס על הכנסה חודשית: {formatCurrency(totalIncome)}
        </p>
      </div>
    </div>
  );
}
