import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { getCategoryTotal } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
  showToggle?: boolean;
}

interface ChartItem {
  name: string;
  value: number;
  color: string;
  pct: number;
}

function buildData(
  view: 'month' | 'year',
  months: ReturnType<typeof useFinanceStore.getState>['months'],
  monthIndex: number,
  recurringExpenses: ReturnType<typeof useFinanceStore.getState>['recurringExpenses']
): ChartItem[] {
  const raw = CATEGORIES.map((cat) => {
    let value = 0;
    if (view === 'month') {
      const md = months[monthIndex];
      value = (md ? getCategoryTotal(md.expenses, cat.id) : 0)
        + getCategoryTotal(recurringExpenses, cat.id);
    } else {
      value = Object.values(months).reduce((sum, md) => sum + getCategoryTotal(md.expenses, cat.id), 0)
        + getCategoryTotal(recurringExpenses, cat.id) * 12;
    }
    return { name: cat.nameHe, value, color: cat.color };
  }).filter((d) => d.value > 0);

  const total = raw.reduce((s, d) => s + d.value, 0);
  return raw
    .map((d) => ({ ...d, pct: total > 0 ? (d.value / total) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartItem }[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm" dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
        <span className="font-semibold text-[#1E1E2E]">{item.name}</span>
      </div>
      <p className="text-[#4A4A60]">{formatCurrency(item.value)}</p>
      <p className="text-[#9090A8] text-xs">{item.pct.toFixed(1)}% מסה״כ הוצאות</p>
    </div>
  );
}

export default function ExpenseCategoryBarChart({ monthIndex, showToggle = true }: Props) {
  const [view, setView] = useState<'month' | 'year'>('month');
  const months = useFinanceStore((s) => s.months);
  const recurringExpenses = useFinanceStore((s) => s.recurringExpenses);

  const data = buildData(view, months, monthIndex, recurringExpenses);
  const total = data.reduce((s, d) => s + d.value, 0);

  const chartHeight = Math.max(240, data.length * 46);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: '#D4A0A0' }} />
        <div className="p-6 flex items-center justify-center h-64">
          <p className="text-[#9090A8] text-sm">אין נתוני הוצאות להצגה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: '#D4A0A0' }} />

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5" dir="rtl">
          <div>
            <h3 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider">
              הוצאות לפי קטגוריה
            </h3>
            <p className="text-xs text-[#9090A8] mt-0.5">
              סה״כ: <span className="font-semibold text-[#1E1E2E]">{formatCurrency(total)}</span>
            </p>
          </div>

          {/* Month / Year toggle — hidden when showToggle=false */}
          {showToggle && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                  view === 'month'
                    ? 'bg-white text-[#1E1E2E] shadow-sm'
                    : 'text-[#9090A8] hover:text-[#4A4A60]'
                }`}
              >
                חודש
              </button>
              <button
                onClick={() => setView('year')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer ${
                  view === 'year'
                    ? 'bg-white text-[#1E1E2E] shadow-sm'
                    : 'text-[#9090A8] hover:text-[#4A4A60]'
                }`}
              >
                שנה
              </button>
            </div>
          )}
        </div>

        {/* Chart — rendered LTR so bars grow left→right */}
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 90, left: 8, bottom: 0 }}
              barCategoryGap="20%"
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9090A8' }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#4A4A60', fontFamily: 'Heebo, sans-serif' }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F2F3F7' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {data.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  formatter={(v: unknown) => formatCurrency(Number(v))}
                  style={{ fontSize: 11, fill: '#4A4A60', fontFamily: 'Heebo, sans-serif' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top-3 callout */}
        {data.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100" dir="rtl">
            <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-2.5">
              גדולות ביותר
            </p>
            <div className="flex flex-wrap gap-2">
              {data.slice(0, 3).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-3 py-1.5"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-medium text-[#1E1E2E]">{item.name}</span>
                  <span className="text-xs text-[#9090A8]">{item.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
