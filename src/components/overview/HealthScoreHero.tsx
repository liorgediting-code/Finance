import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ResponsiveContainer, LineChart, Line, Tooltip, ReferenceLine } from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { computeHealthScore } from '../../utils/healthScore';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const MONTH_SHORT  = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

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

function ScoreBarMobile({ label, value, max, displayValue }: { label: string; value: number; max: number; displayValue: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#4A4A60]">{label}</span>
        <span className="text-[11px] text-[#4A4A60] font-medium">{displayValue}</span>
      </div>
      <div className="h-1.5 bg-white/30 rounded-full">
        <div className="h-1.5 bg-white/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: { month: string; score: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white/90 border border-white/50 rounded-lg px-2 py-1 shadow text-xs text-[#1E1E2E]">
      <span className="font-semibold">{d.month}</span>: {d.score}
    </div>
  );
}

export default function HealthScoreHero() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { mortgages, debts, lifeGoals, savingsFunds, enabledModules } = useFinanceStore(
    useShallow((s) => ({
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsFunds: s.savingsFunds,
      enabledModules: s.settings.enabledModules ?? [],
    }))
  );

  const showTrend = enabledModules.includes('health-score-history');

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  const currentMonth = now.getMonth();

  const { result, delta } = useMemo(() => {
    const r = computeHealthScore({ months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds });
    const prevMonth = (currentMonth - 1 + 12) % 12;
    const prev = computeHealthScore({ months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds, currentMonthOverride: prevMonth });
    return { result: r, delta: r.score - prev.score };
  }, [months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds, currentMonth]);

  const trendData = useMemo(() => {
    if (!showTrend) return [];
    const pts: { month: string; score: number; m: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const md = months[m];
      const hasData = md && (md.income.length > 0 || md.expenses.length > 0);
      if (!hasData) continue;
      const s = computeHealthScore({ months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds, currentMonthOverride: m });
      pts.push({ month: MONTH_SHORT[m], score: s.score, m });
    }
    return pts;
  }, [showTrend, months, recurringIncomes, recurringExpenses, mortgages, debts, lifeGoals, savingsFunds]);

  const scoreColor = result.score >= 70 ? 'text-sage-dark' : result.score >= 40 ? 'text-almond-dark' : 'text-blush-dark';

  return (
    <div className="rounded-2xl shadow-sm p-4 md:p-5 bg-gradient-to-l from-sage-light via-powder-light to-blush-light" dir="rtl">
      {/* Top row: circle + title side by side on mobile */}
      <div className="flex items-center gap-3 mb-3 md:hidden">
        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/70 flex flex-col items-center justify-center shadow-sm">
          <span className={`text-xl font-black ${scoreColor}`}>{result.score}</span>
          <span className="text-[9px] text-[#6B6B8A]">מתוך 100</span>
          {delta !== 0 && (
            <div className={`text-[10px] font-semibold ${delta > 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>
              {delta > 0 ? `↑ ${delta}` : `↓ ${Math.abs(delta)}`}
            </div>
          )}
        </div>
        <div className="flex-1 text-right">
          <h2 className="text-sm font-bold text-[#1E1E2E]">בריאות פיננסית</h2>
          <p className="text-xs text-[#6B6B8A]">{currentMonthName} {year}</p>
        </div>
      </div>

      {/* Desktop: horizontal flex */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white/70 flex flex-col items-center justify-center shadow-sm">
          <span className={`text-2xl font-black ${scoreColor}`}>{result.score}</span>
          <span className="text-[10px] text-[#6B6B8A]">מתוך 100</span>
          {delta !== 0 && (
            <div className={`text-[11px] font-semibold mt-0.5 ${delta > 0 ? 'text-sage-dark' : 'text-blush-dark'}`}>
              {delta > 0 ? `↑ ${delta}` : `↓ ${Math.abs(delta)}`}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <ScoreBar label="שיעור חיסכון" value={result.breakdown.savingsRate} max={30} displayValue={`${result.savingsRatePct}%`} />
          <ScoreBar label="יחס חוב/הכנסה" value={result.breakdown.debtRatio} max={25} displayValue={result.debtRatioLabel} />
          <ScoreBar label="התקדמות יעדים" value={result.breakdown.goalsProgress} max={20} displayValue={`${result.goalsAvgPct}%`} />
          <ScoreBar label="עמידה בתקציב" value={result.breakdown.budgetAdherence} max={15} displayValue={`${result.positiveMonths}/12`} />
        </div>
        <div className="flex-shrink-0 text-right">
          <h2 className="text-base font-bold text-[#1E1E2E]">בריאות פיננסית</h2>
          <p className="text-xs text-[#6B6B8A]">{currentMonthName} {year}</p>
        </div>
      </div>

      {/* Mobile: bars below the header row */}
      <div className="flex flex-col gap-2 md:hidden">
        <ScoreBarMobile label="שיעור חיסכון" value={result.breakdown.savingsRate} max={30} displayValue={`${result.savingsRatePct}%`} />
        <ScoreBarMobile label="יחס חוב/הכנסה" value={result.breakdown.debtRatio} max={25} displayValue={result.debtRatioLabel} />
        <ScoreBarMobile label="התקדמות יעדים" value={result.breakdown.goalsProgress} max={20} displayValue={`${result.goalsAvgPct}%`} />
        <ScoreBarMobile label="עמידה בתקציב" value={result.breakdown.budgetAdherence} max={15} displayValue={`${result.positiveMonths}/12`} />
      </div>

      {/* Health score trend sparkline — feature: health-score-history */}
      {showTrend && trendData.length >= 2 && (
        <div className="mt-3 pt-3 border-t border-white/30">
          <p className="text-[10px] text-[#4A4A60] mb-1 text-right">מגמת ציון בריאות — {year}</p>
          <div style={{ height: 56 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                <ReferenceLine y={70} stroke="rgba(255,255,255,0.4)" strokeDasharray="3 3" />
                <Tooltip content={<TrendTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'white', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'white', strokeWidth: 0 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-[9px] text-[#4A4A60] px-1 mt-0.5">
            {trendData.map((d) => (
              <span key={d.m}>{d.month}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
