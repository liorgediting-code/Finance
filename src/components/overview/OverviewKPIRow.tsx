import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

function KPICard({
  label, value, sub, valueClass,
}: { label: string; value: string; sub: string; valueClass: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-1">
      <span className="text-xs text-[#9090A8]">{label}</span>
      <span className={`text-lg font-bold ${valueClass}`}>{value}</span>
      <span className="text-[11px] text-[#9090A8]">{sub}</span>
    </div>
  );
}

export default function OverviewKPIRow() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { mortgages, debts } = useFinanceStore(
    useShallow((s) => ({ mortgages: s.mortgages, debts: s.debts }))
  );

  const currentMonth = new Date().getMonth();
  const md = months[currentMonth];

  const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyIncome = recurringIncome + (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = recurringExpense + (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round((net / monthlyIncome) * 100) : 0;

  const totalDebt =
    mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0) +
    debts.reduce((s, d) => s + d.balance, 0);

  // 3-month average for trend
  const prevMonths = [1, 2, 3].map((offset) => {
    const idx = ((currentMonth - offset) + 12) % 12;
    const prev = months[idx];
    return recurringIncome + (prev?.income ?? []).reduce((s, e) => s + e.amount, 0);
  });
  const avgIncome = prevMonths.reduce((s, v) => s + v, 0) / 3;
  const incomeTrend = avgIncome > 0 ? Math.round(((monthlyIncome - avgIncome) / avgIncome) * 100) : 0;

  const prevExpenses = [1, 2, 3].map((offset) => {
    const idx = ((currentMonth - offset) + 12) % 12;
    const prev = months[idx];
    return recurringExpense + (prev?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  });
  const avgExpense = prevExpenses.reduce((s, v) => s + v, 0) / 3;
  const expenseTrend = avgExpense > 0 ? Math.round(((monthlyExpense - avgExpense) / avgExpense) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPICard
        label="הכנסה החודש"
        value={formatCurrency(monthlyIncome)}
        sub={incomeTrend >= 0 ? `↑ ${incomeTrend}% מהממוצע` : `↓ ${Math.abs(incomeTrend)}% מהממוצע`}
        valueClass="text-sage-dark"
      />
      <KPICard
        label="הוצאות החודש"
        value={formatCurrency(monthlyExpense)}
        sub={expenseTrend <= 0 ? `↓ ${Math.abs(expenseTrend)}% מהממוצע` : `↑ ${expenseTrend}% מהממוצע`}
        valueClass="text-blush-dark"
      />
      <KPICard
        label="חיסכון נטו"
        value={formatCurrency(net)}
        sub={`${savingsRate}% משיעור הכנסה`}
        valueClass={net >= 0 ? 'text-powder-dark' : 'text-blush-dark'}
      />
      <KPICard
        label="סך חובות"
        value={formatCurrency(totalDebt)}
        sub="משכנתה + הלוואות"
        valueClass="text-almond-dark"
      />
    </div>
  );
}
