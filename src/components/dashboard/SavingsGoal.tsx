import { useFinanceStore } from '../../store/useFinanceStore';
import { sumAmounts, calcRemaining } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-[#9090A8] text-center">{pct.toFixed(0)}% מהיעד</p>
    </div>
  );
}

function GoalRow({ label, value, valueClass = 'text-[#1E1E2E]' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-[#6B6B8A]">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function SavingsGoal() {
  const settings = useFinanceStore((s) => s.settings);
  const months = useFinanceStore((s) => s.months);
  const { monthlyTarget, vacationGoal, vacationSaved } = settings.savingsGoal;

  const currentMonthIndex = new Date().getMonth();
  const currentMonth = months[currentMonthIndex];
  const income = currentMonth ? sumAmounts(currentMonth.income) : 0;
  const expenses = currentMonth ? sumAmounts(currentMonth.expenses) : 0;
  const actualSavings = calcRemaining(income, expenses);
  const diff = actualSavings - monthlyTarget;

  const vacationRemaining = Math.max(vacationGoal - vacationSaved, 0);
  const vacationPct = vacationGoal > 0 ? Math.min((vacationSaved / vacationGoal) * 100, 100) : 0;
  const monthlyMet = monthlyTarget > 0 && actualSavings >= monthlyTarget;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Monthly Savings Goal */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: monthlyMet ? '#6BBF6B' : '#E8D890' }} />
        <div className="p-6">
          <h3 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">
            יעד חיסכון חודשי
          </h3>
          <div className="divide-y divide-gray-100 mb-4">
            <GoalRow label="יעד" value={formatCurrency(monthlyTarget)} />
            <GoalRow
              label="בפועל"
              value={formatCurrency(actualSavings)}
              valueClass={actualSavings >= 0 ? 'text-green-600' : 'text-red-500'}
            />
            <GoalRow
              label="הפרש"
              value={`${diff >= 0 ? '+' : ''}${formatCurrency(diff)}`}
              valueClass={diff >= 0 ? 'text-green-600' : 'text-red-500'}
            />
          </div>
          <ProgressBar
            value={Math.max(actualSavings, 0)}
            max={monthlyTarget}
            color={monthlyMet ? '#6BBF6B' : '#E8A838'}
          />
        </div>
      </div>

      {/* Vacation Fund */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: vacationPct >= 100 ? '#6BBF6B' : '#B8CCE0' }} />
        <div className="p-6">
          <h3 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">
            קופת חיסכון לחופשה
          </h3>
          <div className="divide-y divide-gray-100 mb-4">
            <GoalRow label="יעד" value={formatCurrency(vacationGoal)} />
            <GoalRow label="נחסך" value={formatCurrency(vacationSaved)} valueClass="text-green-600" />
            <GoalRow label="נותר" value={formatCurrency(vacationRemaining)} />
          </div>
          <ProgressBar
            value={vacationSaved}
            max={vacationGoal}
            color={vacationPct >= 100 ? '#6BBF6B' : '#90A8C0'}
          />
        </div>
      </div>
    </div>
  );
}
