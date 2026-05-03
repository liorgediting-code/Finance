import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const MONTH_SHORT = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
const CHART_COLORS = ['#7B6DC8', '#6AAF58', '#E8A840', '#E06060', '#4AACAC'];

function getCatName(catId: string): string {
  return CATEGORIES.find((c) => c.id === catId)?.nameHe ?? catId;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-3 text-sm text-right" dir="rtl">
      <p className="font-semibold text-[#1E1E2E] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#4A4A60]">
          {getCatName(p.name)}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function SpendingTrendsPage() {
  const { months } = useActiveBoardData();

  const now = new Date();
  const currentMonthIdx = now.getMonth();

  // Build last 6 month indices (may wrap around previous year)
  const monthIndices = Array.from({ length: 6 }, (_, i) => {
    const raw = currentMonthIdx - 5 + i;
    return raw < 0 ? raw + 12 : raw;
  });

  // Collect spending per category per month
  const categoryTotals: Record<string, Record<number, number>> = {};
  for (const mIdx of monthIndices) {
    for (const exp of months[mIdx]?.expenses ?? []) {
      if (!categoryTotals[exp.categoryId]) categoryTotals[exp.categoryId] = {};
      categoryTotals[exp.categoryId][mIdx] =
        (categoryTotals[exp.categoryId][mIdx] ?? 0) + exp.amount;
    }
  }

  // Top 5 categories by total spend across the 6-month window
  const topCategories = Object.entries(categoryTotals)
    .map(([catId, byMonth]) => ({
      catId,
      total: Object.values(byMonth).reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Build chart data rows
  const chartData = monthIndices.map((mIdx) => {
    const row: Record<string, number | string> = { month: MONTH_SHORT[mIdx] };
    for (const { catId } of topCategories) {
      row[catId] = categoryTotals[catId]?.[mIdx] ?? 0;
    }
    return row;
  });

  // Month-over-month change for each top category
  const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
  const trends = topCategories.map(({ catId }) => {
    const last = categoryTotals[catId]?.[currentMonthIdx] ?? 0;
    const prev = categoryTotals[catId]?.[prevMonthIdx] ?? 0;
    const change = prev > 0 ? ((last - prev) / prev) * 100 : last > 0 ? 100 : 0;
    return { catId, last, prev, change };
  });

  if (topCategories.length === 0) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#1E1E2E]">מגמות הוצאה</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">השוואת הוצאות לפי קטגוריה ב-6 חודשים האחרונים</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">📈</p>
          <p className="text-sm font-medium text-[#1E1E2E]">אין מספיק נתונים להצגת מגמות</p>
          <p className="text-xs text-[#9090A8] mt-1">הוסף הוצאות כדי לראות את הדפוסים שלך</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">מגמות הוצאה</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">
          5 הקטגוריות המובילות ב-6 חודשים האחרונים
        </p>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <h2 className="text-sm font-semibold text-[#1E1E2E] mb-3">הוצאות לפי קטגוריה</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barCategoryGap="20%" barGap={2}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9090A8' }} axisLine={false} tickLine={false} />
            <YAxis
              hide={false}
              tick={{ fontSize: 10, fill: '#9090A8' }}
              tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))}
              width={36}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8, direction: 'rtl' }}
              formatter={(value: string) => (
                <span className="text-[#4A4A60]">{getCatName(value)}</span>
              )}
            />
            {topCategories.map(({ catId }, idx) => (
              <Bar
                key={catId}
                dataKey={catId}
                fill={CHART_COLORS[idx % CHART_COLORS.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Month-over-month table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-[#1E1E2E]">שינוי חודש-על-חודש</h2>
          <p className="text-xs text-[#9090A8] mt-0.5">
            {MONTH_SHORT[prevMonthIdx]} ← {MONTH_SHORT[currentMonthIdx]}
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {trends.map(({ catId, last, prev, change }) => (
            <div key={catId} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#1E1E2E]">{getCatName(catId)}</p>
                <p className="text-xs text-[#9090A8]">
                  {formatCurrency(prev)} ← {formatCurrency(last)}
                </p>
              </div>
              <span
                className={`text-sm font-bold ${
                  change > 5
                    ? 'text-red-500'
                    : change < -5
                    ? 'text-sage-dark'
                    : 'text-[#9090A8]'
                }`}
              >
                {change > 0 ? '▲' : change < 0 ? '▼' : '—'}{' '}
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
