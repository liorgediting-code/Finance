import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { HEBREW_MONTHS } from '../../config/months';
import { formatCurrency } from '../../utils/formatters';

const TOP_N = 5;

function TrendingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-right" dir="rtl">
      <p className="text-xs font-semibold text-[#1E1E2E] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between items-center gap-4 text-xs py-0.5">
          <span style={{ color: p.color }} className="font-medium">{p.name}</span>
          <span className="font-bold text-[#1E1E2E]">{formatCurrency(p.value)}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="flex justify-between items-center gap-4 text-xs pt-1 mt-1 border-t border-gray-100 font-bold">
          <span className="text-[#6B6B8A]">סה&quot;כ</span>
          <span className="text-[#1E1E2E]">{formatCurrency(total)}</span>
        </div>
      )}
    </div>
  );
}

export default function SpendingTrendsPage() {
  const { months, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);

  const [view, setView] = useState<'bar' | 'line'>('bar');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);

  // Compute per-category totals per month
  const monthlyData = Array.from({ length: 12 }, (_, mi) => {
    const monthData = months[mi];
    const expenses = [...recurringExpenses, ...(monthData?.expenses ?? [])];
    const catTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      if (!e.isPending) {
        catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + e.amount;
      }
    });
    const total = Object.values(catTotals).reduce((s, v) => s + v, 0);
    return { month: HEBREW_MONTHS[mi], total, ...catTotals };
  });

  // Find top N categories by annual total
  const annualCatTotals: Record<string, number> = {};
  monthlyData.forEach((md) => {
    CATEGORIES.forEach((cat) => {
      annualCatTotals[cat.id] = (annualCatTotals[cat.id] ?? 0) + ((md as unknown as Record<string, number>)[cat.id] ?? 0);
    });
  });
  const sortedCats = [...CATEGORIES].sort((a, b) => (annualCatTotals[b.id] ?? 0) - (annualCatTotals[a.id] ?? 0));
  const topCats = sortedCats.filter((c) => (annualCatTotals[c.id] ?? 0) > 0).slice(0, TOP_N);
  const displayCats = selectedCatId
    ? CATEGORIES.filter((c) => c.id === selectedCatId)
    : topCats;

  // Monthly average and max
  const nonZeroMonths = monthlyData.filter((m) => m.total > 0);
  const avgMonthly = nonZeroMonths.length > 0
    ? nonZeroMonths.reduce((s, m) => s + m.total, 0) / nonZeroMonths.length
    : 0;
  const maxMonth = monthlyData.reduce((best, m) => m.total > best.total ? m : best, monthlyData[0]);
  const annualTotal = monthlyData.reduce((s, m) => s + m.total, 0);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-lavender text-[#5B52A0]">
            <TrendingIcon />
          </div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">מגמות הוצאות</h1>
        </div>
        <p className="text-sm text-[#6B6B8A]">מעקב אחר שינויים בהוצאות לאורך שנת {year}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'סה"כ שנתי', value: formatCurrency(annualTotal), sub: `שנת ${year}` },
          { label: 'ממוצע חודשי', value: formatCurrency(avgMonthly), sub: 'לחודש פעיל' },
          { label: 'חודש שיא', value: maxMonth.month, sub: formatCurrency(maxMonth.total) },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
            <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-1">{label}</p>
            <p className="text-base font-black text-[#1E1E2E]">{value}</p>
            <p className="text-[10px] text-[#9090A8] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Category filter + view toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider">הצג קטגוריות</p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setView('bar')}
              className={`text-xs px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${view === 'bar' ? 'bg-white text-[#1E1E2E] shadow-sm' : 'text-[#9090A8]'}`}
            >
              עמודות
            </button>
            <button
              onClick={() => setView('line')}
              className={`text-xs px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${view === 'line' ? 'bg-white text-[#1E1E2E] shadow-sm' : 'text-[#9090A8]'}`}
            >
              קווים
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer font-medium ${!selectedCatId ? 'bg-lavender text-[#5B52A0] shadow-sm' : 'text-[#9090A8] hover:bg-gray-100'}`}
          >
            Top {TOP_N}
          </button>
          {sortedCats.filter((c) => (annualCatTotals[c.id] ?? 0) > 0).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id === selectedCatId ? null : cat.id)}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
              style={
                selectedCatId === cat.id
                  ? { backgroundColor: cat.color + '28', color: cat.color, fontWeight: 600, border: `1.5px solid ${cat.color}40` }
                  : { color: '#9090A8', border: '1.5px solid transparent' }
              }
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              {cat.nameHe}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <ResponsiveContainer width="100%" height={280}>
          {view === 'bar' ? (
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9090A8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9090A8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {displayCats.map((cat) => (
                <Bar key={cat.id} dataKey={cat.id} name={cat.nameHe} fill={cat.color} radius={[3, 3, 0, 0]} stackId="a" />
              ))}
            </BarChart>
          ) : (
            <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9090A8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9090A8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₪${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              {displayCats.map((cat) => (
                <Line
                  key={cat.id}
                  type="monotone"
                  dataKey={cat.id}
                  name={cat.nameHe}
                  stroke={cat.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: cat.color }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Monthly summary grid */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p className="text-xs font-semibold text-[#6B6B8A] mb-3">סיכום חודשי</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {monthlyData.map((md) => {
            const isMax = md.month === maxMonth.month && md.total === maxMonth.total;
            return (
              <div
                key={md.month}
                className={`text-center p-2.5 rounded-xl transition-colors ${isMax ? 'bg-blush-light border border-blush-dark/30' : 'bg-gray-50 hover:bg-lavender-light'}`}
              >
                <p className="text-[10px] font-medium text-[#6B6B8A]">{md.month}</p>
                <p className={`text-sm font-bold mt-0.5 ${isMax ? 'text-blush-dark' : 'text-[#1E1E2E]'}`}>
                  {formatCurrency(md.total)}
                </p>
                {isMax && <p className="text-[8px] text-blush-dark font-semibold mt-0.5">שיא</p>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top categories table */}
      {sortedCats.filter((c) => (annualCatTotals[c.id] ?? 0) > 0).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4 border border-gray-100">
          <p className="text-xs font-semibold text-[#6B6B8A] mb-3">קטגוריות מובילות שנתית</p>
          <div className="space-y-2">
            {sortedCats.filter((c) => (annualCatTotals[c.id] ?? 0) > 0).slice(0, 8).map((cat, idx) => {
              const total = annualCatTotals[cat.id] ?? 0;
              const maxTotal = annualCatTotals[sortedCats[0].id] ?? 1;
              const pct = Math.round((total / annualTotal) * 100);
              return (
                <div key={cat.id} className="flex items-center gap-3">
                  <span className="text-xs text-[#9090A8] w-4 text-left flex-shrink-0">{idx + 1}</span>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-[#1E1E2E] flex-1">{cat.nameHe}</span>
                  <div className="flex-1 max-w-[120px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(total / maxTotal) * 100}%`, backgroundColor: cat.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#1E1E2E] w-20 text-left">{formatCurrency(total)}</span>
                  <span className="text-[10px] text-[#9090A8] w-8 text-left">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
