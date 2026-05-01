import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { computeHealthScore } from '../../utils/healthScore';
import { HEBREW_MONTHS } from '../../config/months';

interface GradeInfo {
  grade: string;
  color: string;
  bgColor: string;
  label: string;
}

function getGrade(score: number, max: number): GradeInfo {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 90) return { grade: 'A', color: '#22863A', bgColor: '#E6F4EA', label: 'מצוין' };
  if (pct >= 75) return { grade: 'B', color: '#0969DA', bgColor: '#DFF0FB', label: 'טוב מאוד' };
  if (pct >= 60) return { grade: 'C', color: '#A36A00', bgColor: '#FFF8C5', label: 'סביר' };
  if (pct >= 40) return { grade: 'D', color: '#CF222E', bgColor: '#FFEBE9', label: 'דורש שיפור' };
  return { grade: 'F', color: '#8A1A1A', bgColor: '#FFEBE9', label: 'חמור' };
}

interface GradeCardProps {
  key?: string;
  label: string;
  value: number;
  max: number;
  hint: string;
  tip: string;
}

function GradeCard({ label, value, max, hint, tip }: GradeCardProps) {
  const { grade, color, bgColor, label: gradeLabel } = getGrade(value, max);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1E1E2E]">{label}</p>
          <p className="text-xs text-[#9090A8] mt-0.5">{hint}</p>
        </div>
        <div className="flex flex-col items-center mr-3">
          <span
            className="text-3xl font-black leading-none"
            style={{ color }}
          >
            {grade}
          </span>
          <span
            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-1"
            style={{ backgroundColor: bgColor, color }}
          >
            {gradeLabel}
          </span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      <p className="text-[10px] text-[#9090A8] leading-relaxed">{tip}</p>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 6 2 6 2 14a6 6 0 0 0 6 6h8a6 6 0 0 0 6-6V6h-6" />
      <rect x="8" y="2" width="8" height="6" rx="1" />
      <line x1="12" y1="14" x2="12" y2="17" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

export default function MonthlyReportCardPage() {
  const year = useFinanceStore((s) => s.settings.year);
  const { mortgages, debts, lifeGoals, savingsFunds } = useFinanceStore(
    useShallow((s) => ({
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsFunds: s.savingsFunds,
    }))
  );
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const result = computeHealthScore({
    months,
    recurringIncomes,
    recurringExpenses,
    mortgages,
    debts,
    lifeGoals,
    savingsFunds,
    currentMonthOverride: selectedMonth,
  });

  const prevMonthIdx = selectedMonth === 0 ? 11 : selectedMonth - 1;
  const prevResult = computeHealthScore({
    months,
    recurringIncomes,
    recurringExpenses,
    mortgages,
    debts,
    lifeGoals,
    savingsFunds,
    currentMonthOverride: prevMonthIdx,
  });

  const overallGrade = getGrade(result.score, 100);
  const diff = result.score - prevResult.score;

  const categories = [
    {
      label: 'שיעור חיסכון',
      value: result.breakdown.savingsRate,
      max: 30,
      hint: `${result.savingsRatePct}% מההכנסה נחסכים`,
      tip: result.savingsRatePct >= 20
        ? 'מצוין! שיעור חיסכון גבוה מ-20% מצביע על ניהול פיננסי בריא.'
        : result.savingsRatePct >= 10
          ? 'נסה להגיע ל-20% חיסכון מתוך ההכנסה החודשית.'
          : 'מומלץ לבחון הוצאות שניתן להפחית כדי להגדיל את החיסכון.',
    },
    {
      label: 'ניהול חובות',
      value: result.breakdown.debtRatio,
      max: 25,
      hint: `עומס חובות: ${result.debtRatioLabel}`,
      tip: result.debtRatioLabel === 'נמוך'
        ? 'יחס חוב-להכנסה נמוך — בריאות פיננסית טובה.'
        : result.debtRatioLabel === 'מתון'
          ? 'נסה לפרוע חובות יקרים (ריבית גבוהה) לפני שאר ההוצאות.'
          : 'עומס חובות גבוה. שקול ייעוץ לגיבוש אסטרטגיית פירעון.',
    },
    {
      label: 'התקדמות מטרות',
      value: result.breakdown.goalsProgress,
      max: 20,
      hint: `${result.goalsAvgPct}% ממוצע לכל המטרות`,
      tip: lifeGoals.length === 0
        ? 'לא הוגדרו מטרות חיסכון. הוסף מטרות כדי לעקוב אחר ההתקדמות שלך.'
        : result.goalsAvgPct >= 50
          ? 'התקדמות טובה! המשך להפריש באופן קבוע.'
          : 'הגדל הפרשות חודשיות למטרות כדי לשפר את הציון.',
    },
    {
      label: 'עמידה בתקציב',
      value: result.breakdown.budgetAdherence,
      max: 15,
      hint: `${result.positiveMonths}/12 חודשים עם עודף`,
      tip: result.positiveMonths >= 10
        ? 'ניהול תקציב מצוין! ההכנסות עולות על ההוצאות ברוב החודשים.'
        : result.positiveMonths >= 6
          ? 'ניסה להפוך יותר חודשים לחיוביים על ידי קיצוץ בהוצאות משתנות.'
          : 'מומלץ לבחון מחדש את ההוצאות הקבועות ולקבוע תקציב מציאותי.',
    },
    {
      label: 'קרנות חיסכון',
      value: result.breakdown.savingsFundProgress,
      max: 10,
      hint: `${result.savingsFundAvgPct}% ממוצע מיעד`,
      tip: savingsFunds.length === 0
        ? 'לא הוגדרו קרנות חיסכון. מומלץ להקים קרן חירום של 3-6 משכורות.'
        : result.savingsFundAvgPct >= 80
          ? 'מצוין! קרנות החיסכון שלך ממלאות יפה.'
          : 'הפרש סכום קבוע מדי חודש לקרנות החיסכון.',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-lavender text-[#5B52A0]">
            <TrophyIcon />
          </div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">כרטיס ציון פיננסי</h1>
        </div>
        <p className="text-sm text-[#6B6B8A]">הערכה מפורטת של הבריאות הפיננסית שלך לפי חודש</p>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-2">בחר חודש</p>
        <div className="flex gap-1.5 flex-wrap">
          {HEBREW_MONTHS.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMonth(i)}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer font-medium ${
                selectedMonth === i
                  ? 'bg-lavender text-[#5B52A0] shadow-sm'
                  : 'text-[#9090A8] hover:bg-gray-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Overall grade hero */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-4 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-1">
              ציון כללי — {HEBREW_MONTHS[selectedMonth]} {year}
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-black leading-none" style={{ color: overallGrade.color }}>
                {overallGrade.grade}
              </span>
              <div>
                <p className="text-2xl font-bold text-[#1E1E2E]">{result.score}</p>
                <p className="text-xs text-[#9090A8]">מתוך 100</p>
              </div>
            </div>
            <span
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-2"
              style={{ backgroundColor: overallGrade.bgColor, color: overallGrade.color }}
            >
              {overallGrade.label}
            </span>
          </div>

          {/* Progress ring visualization */}
          <div className="relative flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F0F0F8" strokeWidth="2.5" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={overallGrade.color}
                strokeWidth="2.5"
                strokeDasharray={`${result.score} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {diff !== 0 && (
                <span className={`text-xs font-bold ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {diff > 0 ? '▲' : '▼'}{Math.abs(diff)}
                </span>
              )}
              <span className="text-[9px] text-[#9090A8]">vs חודש קודם</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          <GradeCard
            key={cat.label}
            label={cat.label}
            value={cat.value}
            max={cat.max}
            hint={cat.hint}
            tip={cat.tip}
          />
        ))}
      </div>

      <p className="text-[10px] text-[#9090A8] text-center mt-4">
        הציון מבוסס על נתוני החודש הנבחר ונתוני שנת {year} הכוללים.
      </p>
    </div>
  );
}
