import { useMemo } from 'react';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const WEEK_NAMES = ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4', 'שבוע 5'];
const LAVENDER = '#7B6DC8';
const LAVENDER_LIGHT = '#B0A8C8';

export default function SpendingDNAPage() {
  const { months } = useActiveBoardData();

  const allExpenses = useMemo(() => {
    const result: { date: string; amount: number; category: string }[] = [];
    Object.values(months).forEach((md) => {
      if (!md) return;
      md.expenses.forEach((e) => {
        if (!e.isPending && !e.isFuture && e.date) {
          result.push({ date: e.date, amount: e.amount, category: e.categoryId });
        }
      });
    });
    return result;
  }, [months]);

  const byDow = useMemo(() => {
    const totals = Array(7).fill(0) as number[];
    const counts = Array(7).fill(0) as number[];
    allExpenses.forEach(({ date, amount }) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return;
      const dow = d.getDay();
      totals[dow] += amount;
      counts[dow]++;
    });
    return DAY_NAMES.map((name, i) => ({
      name,
      total: Math.round(totals[i]),
      count: counts[i],
      avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    }));
  }, [allExpenses]);

  const peakDow = byDow.reduce((best, d) => d.total > best.total ? d : best, byDow[0]);
  const maxDowTotal = Math.max(...byDow.map((d) => d.total), 1);

  const byWom = useMemo(() => {
    const totals = Array(5).fill(0) as number[];
    const counts = Array(5).fill(0) as number[];
    allExpenses.forEach(({ date, amount }) => {
      const d = new Date(date);
      if (isNaN(d.getTime())) return;
      const dayOfMonth = d.getDate();
      const weekIdx = Math.min(Math.floor((dayOfMonth - 1) / 7), 4);
      totals[weekIdx] += amount;
      counts[weekIdx]++;
    });
    return WEEK_NAMES.map((name, i) => ({
      name,
      total: Math.round(totals[i]),
      count: counts[i],
    }));
  }, [allExpenses]);

  const peakWom = byWom.reduce((best, w) => w.total > best.total ? w : best, byWom[0]);

  const byCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    allExpenses.forEach(({ category, amount }) => {
      totals[category] = (totals[category] ?? 0) + amount;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat, total]) => ({ cat, total: Math.round(total) }));
  }, [allExpenses]);

  const totalSpending = allExpenses.reduce((s, e) => s + e.amount, 0);
  const avgPerExpense = allExpenses.length > 0 ? totalSpending / allExpenses.length : 0;

  const CATEGORY_HE: Record<string, string> = {
    home: 'בית', food: 'אוכל וסופר', transport: 'רכב ותחבורה',
    children: 'ילדים', health: 'בריאות', education: 'השכלה',
    personal: 'טיפוח', entertainment: 'בילויים', subscriptions: 'מנויים',
    shopping: 'קניות', pets: 'חיות מחמד', financial: 'ביטוחים',
    savings: 'חיסכון', investments: 'השקעות', holidays: 'חגים', other: 'אחר',
  };

  const PALETTE = ['#7B6DC8', '#50A878', '#5AADE0', '#E8B040', '#C870D8', '#E06060', '#4AACAC', '#C89E50'];

  if (allExpenses.length === 0) {
    return (
      <div className="max-w-4xl mx-auto" dir="rtl">
        <div className="bg-white rounded-xl p-10 text-center shadow-sm">
          <div className="text-5xl mb-3">🧬</div>
          <p className="text-[#1E1E2E] font-medium">אין מספיק נתונים</p>
          <p className="text-sm text-[#9090A8] mt-1">הוסף הוצאות עם תאריכים כדי לראות את ה-DNA של ההוצאות שלך</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-xl font-bold text-[#1E1E2E]">ה-DNA של ההוצאות שלך</h1>
        <p className="text-sm text-[#9090A8] mt-0.5">דפוסי ההוצאה שלך — מתי, כמה ועל מה</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-[#9090A8] mb-1">סה"כ הוצאות מנותחות</p>
          <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(Math.round(totalSpending))}</p>
          <p className="text-xs text-[#9090A8] mt-0.5">{allExpenses.length} עסקאות</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-[#9090A8] mb-1">ממוצע לעסקה</p>
          <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(Math.round(avgPerExpense))}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-xs text-[#9090A8] mb-1">יום שיא בהוצאות</p>
          <p className="text-xl font-bold text-[#1E1E2E]">{peakDow.total > 0 ? peakDow.name : '—'}</p>
          {peakDow.total > 0 && <p className="text-xs text-[#9090A8] mt-0.5">{formatCurrency(peakDow.total)} סה"כ</p>}
        </div>
      </div>

      <div className="bg-lavender/10 border border-lavender/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-lavender-dark mb-2">💡 תובנות</p>
        <ul className="flex flex-col gap-1.5 text-sm text-[#1E1E2E]">
          {peakDow.total > 0 && (
            <li>• יום <strong>{peakDow.name}</strong> הוא יום ההוצאה הגדול שלך ({formatCurrency(peakDow.total)} סה"כ)</li>
          )}
          {peakWom.total > 0 && (
            <li>• <strong>{peakWom.name}</strong> בחודש הוא השבוע היקר ביותר ({formatCurrency(peakWom.total)})</li>
          )}
          {byCategory.length > 0 && (
            <li>• הקטגוריה הגדולה ביותר: <strong>{CATEGORY_HE[byCategory[0].cat] ?? byCategory[0].cat}</strong> ({formatCurrency(byCategory[0].total)})</li>
          )}
          {avgPerExpense > 0 && (
            <li>• עסקאה ממוצעת עומדת על <strong>{formatCurrency(Math.round(avgPerExpense))}</strong></li>
          )}
        </ul>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-4">הוצאות לפי יום בשבוע</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={byDow} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={50} />
            <Tooltip formatter={(v: unknown) => typeof v === 'number' ? formatCurrency(v) : ''} labelFormatter={(l) => `יום ${l}`} />
            <Bar dataKey="total" name={'סה"כ הוצאות'} radius={[4, 4, 0, 0]}>
              {byDow.map((entry, i) => (
                <Cell key={i} fill={entry.total === maxDowTotal ? LAVENDER : LAVENDER_LIGHT} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-4">הוצאות לפי שבוע בחודש</p>
        <div className="flex gap-3">
          {byWom.map((w, i) => {
            const maxWom = Math.max(...byWom.map((x) => x.total), 1);
            const pct = (w.total / maxWom) * 100;
            const isPeak = w.total === peakWom.total && w.total > 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-semibold text-[#1E1E2E]">{w.total > 0 ? formatCurrency(w.total).replace('₪', '').replace(',', ',') : '—'}</p>
                <div className="w-full bg-gray-100 rounded-full overflow-hidden" style={{ height: 80 }}>
                  <div
                    className="w-full rounded-full transition-all"
                    style={{
                      height: `${pct}%`,
                      marginTop: `${100 - pct}%`,
                      backgroundColor: isPeak ? LAVENDER : LAVENDER_LIGHT,
                    }}
                  />
                </div>
                <p className="text-xs text-[#9090A8]">{w.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm font-semibold text-[#1E1E2E] mb-4">הוצאות לפי קטגוריה</p>
          <div className="flex flex-col gap-2">
            {byCategory.map(({ cat, total }, i) => {
              const pct = totalSpending > 0 ? (total / totalSpending) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <p className="text-sm text-[#1E1E2E] w-32 truncate flex-shrink-0">{CATEGORY_HE[cat] ?? cat}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                  </div>
                  <p className="text-sm font-medium text-[#1E1E2E] w-20 text-left">{formatCurrency(total)}</p>
                  <p className="text-xs text-[#9090A8] w-10 text-left">{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
