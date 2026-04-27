import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { computeHealthScore } from '../../utils/healthScore';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function ScoreBar({ label, value, max, displayValue }: { label: string; value: number; max: number; displayValue: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#4A4A60] w-32 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/30 rounded-full">
        <div className="h-1.5 bg-white/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#4A4A60] w-10 text-left flex-shrink-0">{displayValue}</span>
    </div>
  );
}

export default function HealthScoreHero() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { mortgages, debts, lifeGoals, savingsFunds } = useFinanceStore(
    useShallow((s) => ({
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsFunds: s.savingsFunds,
    }))
  );

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();

  const result = computeHealthScore({ months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds });

  const scoreColor = result.score >= 70 ? 'text-sage-dark' : result.score >= 40 ? 'text-almond-dark' : 'text-blush-dark';

  return (
    <div className="rounded-2xl shadow-sm p-5 bg-gradient-to-l from-sage-light via-powder-light to-blush-light flex flex-col md:flex-row items-start md:items-center gap-4">
      {/* Score circle */}
      <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/70 flex flex-col items-center justify-center shadow-sm">
        <span className={`text-2xl font-black ${scoreColor}`}>{result.score}</span>
        <span className="text-[10px] text-[#6B6B8A]">מתוך 100</span>
      </div>

      {/* Score bars */}
      <div className="flex-1 flex flex-col gap-2 w-full">
        <ScoreBar label="שיעור חיסכון" value={result.breakdown.savingsRate} max={30} displayValue={`${result.savingsRatePct}%`} />
        <ScoreBar label="יחס חוב/הכנסה" value={result.breakdown.debtRatio} max={25} displayValue={result.debtRatioLabel} />
        <ScoreBar label="התקדמות יעדים" value={result.breakdown.goalsProgress} max={20} displayValue={`${result.goalsAvgPct}%`} />
        <ScoreBar label="עמידה בתקציב" value={result.breakdown.budgetAdherence} max={15} displayValue={`${result.positiveMonths}/${Object.keys(months).length || 0}`} />
      </div>

      {/* Title */}
      <div className="flex-shrink-0 text-right">
        <h2 className="text-base font-bold text-[#1E1E2E]">בריאות פיננסית</h2>
        <p className="text-xs text-[#6B6B8A]">{currentMonthName} {year}</p>
      </div>
    </div>
  );
}
