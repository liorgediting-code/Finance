import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES } from '../../config/categories';
import { HEBREW_MONTHS } from '../../config/months';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
}

function PctBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-[10px] text-[#9090A8]">—</span>;
  const positive = pct > 0;
  return (
    <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${positive ? 'bg-blush-light text-blush-dark' : 'bg-sage-light text-sage-dark'}`}>
      {positive ? '+' : ''}{pct}%
    </span>
  );
}

function BarComparison({ cur, prev, maxVal }: { cur: number; prev: number; maxVal: number }) {
  const curPct = maxVal > 0 ? (cur / maxVal) * 100 : 0;
  const prevPct = maxVal > 0 ? (prev / maxVal) * 100 : 0;
  return (
    <div className="flex flex-col gap-0.5 w-24 flex-shrink-0">
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-lavender-dark rounded-full transition-all" style={{ width: `${curPct}%` }} />
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full bg-gray-300 rounded-full transition-all" style={{ width: `${prevPct}%` }} />
      </div>
    </div>
  );
}

export default function MonthComparison({ monthIndex }: Props) {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();

  const prevIdx = (monthIndex - 1 + 12) % 12;
  const curMd = months[monthIndex];
  const prevMd = months[prevIdx];

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const curIncome = recurringIncome + (curMd?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const prevIncome = recurringIncome + (prevMd?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const curExpense = recurringExpense + (curMd?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const prevExpense = recurringExpense + (prevMd?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const curNet = curIncome - curExpense;
  const prevNet = prevIncome - prevExpense;

  const pct = (cur: number, prev: number) =>
    prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100);

  // Category breakdown
  const catData: Array<{ id: string; name: string; color: string; cur: number; prev: number }> = [];

  const allCatIds = new Set<string>();
  (curMd?.expenses ?? []).forEach((e) => allCatIds.add(e.categoryId));
  (prevMd?.expenses ?? []).forEach((e) => allCatIds.add(e.categoryId));

  for (const catId of allCatIds) {
    const cat = CATEGORIES.find((c) => c.id === catId);
    const cur = (curMd?.expenses ?? []).filter((e) => e.categoryId === catId).reduce((s, e) => s + e.amount, 0);
    const prev = (prevMd?.expenses ?? []).filter((e) => e.categoryId === catId).reduce((s, e) => s + e.amount, 0);
    if (cur + prev === 0) continue;
    catData.push({ id: catId, name: cat?.nameHe ?? catId, color: cat?.color ?? '#ccc', cur, prev });
  }
  catData.sort((a, b) => Math.max(b.cur, b.prev) - Math.max(a.cur, a.prev));
  const maxCat = Math.max(...catData.map((c) => Math.max(c.cur, c.prev)), 1);

  const curLabel = HEBREW_MONTHS[monthIndex];
  const prevLabel = HEBREW_MONTHS[prevIdx];

  const hasData = curIncome > 0 || curExpense > 0 || prevIncome > 0 || prevExpense > 0;

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
        <p className="text-sm text-[#9090A8]">אין נתונים להשוואה עבור חודשים אלה</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-[#6B6B8A]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-lavender-dark" />
          <span>{curLabel} (נוכחי)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-gray-300" />
          <span>{prevLabel} (קודם)</span>
        </div>
      </div>

      {/* Summary comparison */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'הכנסות', cur: curIncome, prev: prevIncome, positive: (p: number) => p > 0 },
          { label: 'הוצאות', cur: curExpense, prev: prevExpense, positive: (p: number) => p < 0 },
          { label: 'חיסכון נטו', cur: curNet, prev: prevNet, positive: (p: number) => p > 0 },
        ].map(({ label, cur, prev, positive }) => {
          const delta = pct(cur, prev);
          return (
            <div key={label} className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-[10px] text-[#9090A8] mb-1">{label}</p>
              <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(cur)}</p>
              <p className="text-[10px] text-[#9090A8]">לעומת {formatCurrency(prev)}</p>
              {delta !== 0 && (
                <div className="mt-1">
                  <span className={`text-[10px] font-bold ${positive(delta) ? 'text-sage-dark' : 'text-blush-dark'}`}>
                    {delta > 0 ? '+' : ''}{delta}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      {catData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-0.5 w-full bg-lavender" />
          <div className="p-4">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">השוואה לפי קטגוריה</p>
            <div className="flex flex-col gap-3">
              {catData.map((cat) => {
                const delta = pct(cat.cur, cat.prev);
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs text-[#4A4A60] truncate">{cat.name}</span>
                    </div>
                    <BarComparison cur={cat.cur} prev={cat.prev} maxVal={maxCat} />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#1E1E2E]">{formatCurrency(cat.cur)}</span>
                      <PctBadge pct={delta} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
