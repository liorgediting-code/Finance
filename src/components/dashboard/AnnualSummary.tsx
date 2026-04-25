import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { HEBREW_MONTHS } from '../../config/months';

interface MonthPoint {
  name: string;
  income: number;
  expenses: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm" dir="rtl">
      <p className="font-semibold text-[#1E1E2E] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'income' ? 'הכנסות' : 'הוצאות'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnnualSummary() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);

  const recurringIncomeTotal = sumAmounts(recurringIncomes);
  const recurringExpenseTotal = sumAmounts(recurringExpenses);

  const currentMonth = new Date().getFullYear() === year ? new Date().getMonth() : 11;

  let yearIncome = 0;
  let yearExpenses = 0;

  const data: MonthPoint[] = HEBREW_MONTHS.slice(0, currentMonth + 1).map((name, idx) => {
    const md = months[idx];
    const income = (md ? sumAmounts(md.income) : 0) + recurringIncomeTotal;
    const expenses = (md ? sumAmounts(md.expenses) : 0) + recurringExpenseTotal;
    yearIncome += income;
    yearExpenses += expenses;
    return { name, income, expenses };
  });

  const yearSaved = yearIncome - yearExpenses;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-lavender-dark" />
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3" dir="rtl">
          סיכום שנתי {year}
        </h3>

        {/* Totals */}
        <div className="grid grid-cols-3 gap-2 mb-4" dir="rtl">
          <div className="bg-sage-light rounded-lg p-2.5 text-center">
            <p className="text-[10px] sm:text-xs text-[#6B6B8A] mb-0.5">הכנסות</p>
            <p className="text-sm sm:text-base font-bold text-[#1E1E2E]">{formatCurrency(yearIncome)}</p>
          </div>
          <div className="bg-blush-light rounded-lg p-2.5 text-center">
            <p className="text-[10px] sm:text-xs text-[#6B6B8A] mb-0.5">הוצאות</p>
            <p className="text-sm sm:text-base font-bold text-[#1E1E2E]">{formatCurrency(yearExpenses)}</p>
          </div>
          <div className={`${yearSaved >= 0 ? 'bg-sage-light' : 'bg-blush-light'} rounded-lg p-2.5 text-center`}>
            <p className="text-[10px] sm:text-xs text-[#6B6B8A] mb-0.5">חיסכון</p>
            <p className={`text-sm sm:text-base font-bold ${yearSaved >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(yearSaved)}</p>
          </div>
        </div>

        {/* Chart */}
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9090A8', fontFamily: 'Heebo, sans-serif' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9090A8' }}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value: string) => value === 'income' ? 'הכנסות' : 'הוצאות'}
                wrapperStyle={{ fontSize: 12, fontFamily: 'Heebo, sans-serif' }}
              />
              <Line type="monotone" dataKey="income" stroke="#5A9A42" strokeWidth={2} dot={{ r: 3 }} name="income" />
              <Line type="monotone" dataKey="expenses" stroke="#9B72C0" strokeWidth={2} dot={{ r: 3 }} name="expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
