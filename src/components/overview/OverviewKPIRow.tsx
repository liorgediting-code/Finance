import { useMemo } from 'react';
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

  const recurringIncome = useMemo(
    () => recurringIncomes.reduce((s, e) => s + e.amount, 0),
    [recurringIncomes]
  );
  const recurringExpense = useMemo(
    () => recurringExpenses.reduce((s, e) => s + e.amount, 0),
    [recurringExpenses]
  );

  const monthlyIncome = recurringIncome + (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const monthlyExpense = recurringExpense + (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? Math.round((net / monthlyIncome) * 100) : 0;

  const totalDebt = useMemo(
    () =>
      mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0) +
      debts.reduce((s, d) => s + d.balance, 0),
    [mortgages, debts]
  );

  // 3-month average for trend — only use months within the same year (no wrap-around)
  const { incomeTrend, expenseTrend } = useMemo(() => {
    const validOffsets = [1, 2, 3].filter((offset) => currentMonth - offset >= 0);

    const prevIncomeSums = validOffsets.map((offset) => {
      const prev = months[currentMonth - offset];
      return recurringIncome + (prev?.income ?? []).reduce((s, e) => s + e.amount, 0);
    });

    const prevMonthsWithData = validOffsets.filter((offset) => {
      const prev = months[currentMonth - offset];
      return (prev?.income?.length ?? 0) > 0 || (prev?.expenses?.length ?? 0) > 0;
    }).length;

    const avgInc = prevIncomeSums.length > 0
      ? prevIncomeSums.reduce((s, v) => s + v, 0) / prevIncomeSums.length
      : 0;

    const prevExpenseSums = validOffsets.map((offset) => {
      const prev = months[currentMonth - offset];
      return recurringExpense + (prev?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    });
    const avgExp = prevExpenseSums.length > 0
      ? prevExpenseSums.reduce((s, v) => s + v, 0) / prevExpenseSums.length
      : 0;

    return {
      incomeTrend: prevMonthsWithData >= 2 && avgInc > 0
        ? Math.round(((monthlyIncome - avgInc) / avgInc) * 100)
        : null,
      expenseTrend: prevMonthsWithData >= 2 && avgExp > 0
        ? Math.round(((monthlyExpense - avgExp) / avgExp) * 100)
        : null,
    };
  }, [months, recurringIncome, recurringExpense, currentMonth, monthlyIncome, monthlyExpense]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPICard
        label="הכנסה החודש"
        value={formatCurrency(monthlyIncome)}
        sub={incomeTrend === null ? 'אין מספיק נתונים' : incomeTrend >= 0 ? `↑ ${incomeTrend}% מהממוצע` : `↓ ${Math.abs(incomeTrend)}% מהממוצע`}
        valueClass="text-sage-dark"
      />
      <KPICard
        label="הוצאות החודש"
        value={formatCurrency(monthlyExpense)}
        sub={expenseTrend === null ? 'אין מספיק נתונים' : expenseTrend <= 0 ? `↓ ${Math.abs(expenseTrend)}% מהממוצע` : `↑ ${expenseTrend}% מהממוצע`}
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
