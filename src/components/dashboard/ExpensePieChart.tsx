import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';
import { getCategoryTotal } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface ExpensePieChartProps {
  monthIndex: number;
}

export default function ExpensePieChart({ monthIndex }: ExpensePieChartProps) {
  const months = useFinanceStore((s) => s.months);
  const monthData = months[monthIndex];
  const expenses = monthData?.expenses ?? [];

  const data = CATEGORIES.map((cat) => ({
    name: cat.nameHe,
    value: getCategoryTotal(expenses, cat.id),
    color: cat.color,
  })).filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-center h-80">
        <p className="text-gray-400 text-lg">אין נתונים להצגה</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">התפלגות הוצאות לפי קטגוריה</h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={3}
            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} stroke="#fff" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ direction: 'rtl', textAlign: 'right' }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value: string) => {
              const item = data.find((d) => d.name === value);
              return `${value} — ${item ? formatCurrency(item.value) : ''}`;
            }}
            wrapperStyle={{ direction: 'rtl', fontSize: '13px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
