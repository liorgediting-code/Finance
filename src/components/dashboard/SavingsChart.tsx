import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { HEBREW_MONTHS } from '../../config/months';
import { sumAmounts, calcRemaining } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

const AREA_COLOR = '#B8CCE0'; // powder blue

export default function SavingsChart() {
  const months = useFinanceStore((s) => s.months);

  const data = HEBREW_MONTHS.map((name, idx) => {
    const monthData = months[idx];
    const income = monthData ? sumAmounts(monthData.income) : 0;
    const expenses = monthData ? sumAmounts(monthData.expenses) : 0;
    const saved = calcRemaining(income, expenses);
    return {
      name,
      saved: Math.max(saved, 0),
    };
  });

  const hasData = data.some((d) => d.saved > 0);

  if (!hasData) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center h-72">
        <p className="text-gray-400 text-lg">אין נתוני חיסכון להצגה</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">חיסכון חודשי לאורך השנה</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={AREA_COLOR} stopOpacity={0.8} />
              <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
            width={50}
          />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), 'חיסכון']}
            contentStyle={{ direction: 'rtl', textAlign: 'right' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Area
            type="monotone"
            dataKey="saved"
            stroke={AREA_COLOR}
            strokeWidth={2}
            fill="url(#savingsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
