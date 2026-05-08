import { useActiveBoardData } from '../../store/useActiveBoardData';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';

// Israeli household average spending as % of gross income (CBS 2023 data)
const BENCHMARKS: Record<string, { pct: number; emoji: string }> = {
  home:          { pct: 28, emoji: '🏠' },
  food:          { pct: 17, emoji: '🍕' },
  transport:     { pct: 12, emoji: '🚗' },
  children:      { pct: 9,  emoji: '👶' },
  health:        { pct: 5,  emoji: '💊' },
  personal:      { pct: 4,  emoji: '✂️' },
  entertainment: { pct: 7,  emoji: '🎭' },
  subscriptions: { pct: 2,  emoji: '📺' },
  shopping:      { pct: 6,  emoji: '🛍️' },
  education:     { pct: 3,  emoji: '📚' },
  pets:          { pct: 1,  emoji: '🐾' },
  financial:     { pct: 8,  emoji: '🏦' },
  savings:       { pct: 10, emoji: '💰' },
  investments:   { pct: 5,  emoji: '📈' },
  holidays:      { pct: 4,  emoji: '🕍' },
  other:         { pct: 2,  emoji: '📦' },
};

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function SpendingBenchmarksPage() {
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);

  // Compute annual totals per category
  const catTotals: Record<string, number> = {};
  let annualIncome = 0;
  for (let mi = 0; mi < 12; mi++) {
    const md = months[mi];
    const expenses = [...recurringExpenses, ...(md?.expenses ?? [])];
    const incomes = [...recurringIncomes, ...(md?.income ?? [])];
    expenses.forEach((e) => {
      if (!e.isPending) {
        catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + e.amount;
      }
    });
    incomes.forEach((i) => { annualIncome += i.amount; });
  }

  const totalExpenses = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const base = annualIncome > 0 ? annualIncome : totalExpenses || 1;

  const rows = CATEGORIES.map((cat) => {
    const spent = catTotals[cat.id] ?? 0;
    const userPct = Math.round((spent / base) * 100);
    const bench = BENCHMARKS[cat.id];
    const benchPct = bench?.pct ?? 0;
    const diff = userPct - benchPct;
    const hasData = spent > 0 || benchPct > 0;
    return { cat, spent, userPct, benchPct, diff, hasData };
  }).filter((r) => r.hasData);

  const overBudgetCount = rows.filter((r) => r.diff > 3).length;
  const underBudgetCount = rows.filter((r) => r.diff < -3 && r.userPct > 0).length;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📊</span>
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">השוואה לממוצע ישראלי</h1>
          <p className="text-sm text-[#9090A8] mt-0.5">נתוני הוצאות שנת {year} מול ממוצע הלמ&quot;ס למשק בית ישראלי</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-sage-light text-sage-dark px-4 py-2 rounded-full text-sm font-semibold">
          ✅ {underBudgetCount} קטגוריות מתחת לממוצע
        </div>
        <div className="bg-blush-light text-blush-dark px-4 py-2 rounded-full text-sm font-semibold">
          ⚠️ {overBudgetCount} קטגוריות מעל הממוצע
        </div>
        {annualIncome > 0 && (
          <div className="bg-lavender-light text-lavender-dark px-4 py-2 rounded-full text-sm font-semibold">
            💰 הכנסה שנתית: {formatCurrency(annualIncome)}
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex gap-2 bg-powder-light/60 border border-powder text-powder-dark rounded-xl p-3 text-xs">
        <InfoIcon />
        <span>הבנצ'מארק מבוסס על נתוני הלמ"ס לשנת 2023 — ממוצע משק בית ישראלי עם 2–4 נפשות. אחוזים מחושבים מסך ההכנסה הכוללת.</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70">
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">קטגוריה</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider hidden sm:table-cell">אתה</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider hidden sm:table-cell">ממוצע</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">הוצאה</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider w-40">פער</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat, spent, userPct, benchPct, diff }, i) => {
              const isOver  = diff > 3;
              const isUnder = diff < -3 && userPct > 0;
              const isNeutral = !isOver && !isUnder;
              const barWidth = Math.min(100, userPct * 2);
              const benchBarWidth = Math.min(100, benchPct * 2);

              return (
                <tr
                  key={cat.id}
                  className={`border-b border-gray-50 transition-colors hover:bg-gray-50/50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{BENCHMARKS[cat.id]?.emoji ?? '📦'}</span>
                      <span className="font-medium text-[#1E1E2E]">{cat.nameHe}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isOver ? 'bg-blush-light text-blush-dark' :
                      isUnder ? 'bg-sage-light text-sage-dark' :
                      'bg-gray-100 text-[#6B6B8A]'
                    }`}>
                      {userPct}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <span className="text-xs text-[#9090A8] font-medium">{benchPct}%</span>
                  </td>
                  <td className="py-3 px-4 text-left" dir="ltr">
                    <span className="text-sm font-semibold text-[#1E1E2E]">{spent > 0 ? formatCurrency(spent) : '—'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      {/* User bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: isOver ? '#E8A0A0' : isUnder ? '#6AAF58' : '#7B6DC8',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-[#9090A8] w-6 text-left">{userPct}%</span>
                      </div>
                      {/* Benchmark bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gray-300"
                            style={{ width: `${benchBarWidth}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 w-6 text-left">{benchPct}%</span>
                      </div>
                      {/* Diff badge */}
                      {!isNeutral && (
                        <span className={`text-[10px] font-bold ${isOver ? 'text-blush-dark' : 'text-sage-dark'}`}>
                          {isOver ? `+${diff}% מהממוצע` : `${diff}% מהממוצע`}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-[#9090A8]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-blush" />
          <span>ההוצאה שלך</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 rounded-full bg-gray-300" />
          <span>ממוצע ישראלי</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blush-dark" />
          <span>מעל הממוצע ב-3%+</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-sage-dark" />
          <span>מתחת לממוצע ב-3%+</span>
        </div>
      </div>
    </div>
  );
}
