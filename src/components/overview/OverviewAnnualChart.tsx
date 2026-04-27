import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_LABELS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md p-3 text-sm text-right" dir="rtl">
      <p className="font-semibold text-[#1E1E2E] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[#4A4A60]">{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
}

export default function OverviewAnnualChart() {
  const navigate = useNavigate();
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);

  const data = MONTH_LABELS.map((label, i) => {
    const md = months[i];
    const income = recurringIncomes.reduce((s, e) => s + e.amount, 0) +
      (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
    const expense = recurringExpenses.reduce((s, e) => s + e.amount, 0) +
      (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    return { label, הכנסות: income, הוצאות: expense, חיסכון: Math.max(0, income - expense) };
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-[#1E1E2E]">סיכום שנתי {year}</span>
        <button
          onClick={() => navigate('/month')}
          className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors cursor-pointer"
        >
          ← חודש נוכחי
        </button>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%" barGap={2}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9090A8' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8, direction: 'rtl' }}
            formatter={(value) => <span className="text-[#4A4A60]">{value}</span>}
          />
          <Bar dataKey="הכנסות" fill="#8DBF78" radius={[3, 3, 0, 0]} />
          <Bar dataKey="הוצאות" fill="#D8C0E8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="חיסכון" fill="#7EB8E0" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
