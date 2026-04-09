import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { HEBREW_MONTHS } from '../../config/months';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

const INCOME_COLOR = '#C5CDB6'; // sage
const EXPENSE_COLOR = '#F2C4C4'; // blush

export default function IncomeExpenseChart() {
  const months = useFinanceStore((s) => s.months);

  const data = HEBREW_MONTHS.map((name, idx) => {
    const monthData = months[idx];
    return {
      name,
      income: monthData ? sumAmounts(monthData.income) : 0,
      expenses: monthData ? sumAmounts(monthData.expenses) : 0,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">הכנסות מול הוצאות — כל השנה</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
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
            formatter={(value, name) => [
              formatCurrency(Number(value)),
              name === 'income' ? 'הכנסות' : 'הוצאות',
            ]}
            contentStyle={{ direction: 'rtl', textAlign: 'right' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'income' ? 'הכנסות' : 'הוצאות'
            }
            wrapperStyle={{ direction: 'rtl' }}
          />
          <Bar dataKey="income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} />
          <Bar dataKey="expenses" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
