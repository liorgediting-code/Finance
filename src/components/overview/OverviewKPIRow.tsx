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
  const { mortgages, debts, installments } = useFinanceStore(
    useShallow((s) => ({ mortgages: s.mortgages, debts: s.debts, installments: s.installments }))
  );

  const currentMonth = new Date().getMonth();
  const md = months[currentMonth];

  const { monthlyIncome, monthlyExpense, net, savingsRate, totalDebt, incomeTrend, expenseTrend } = useMemo(() => {
    const recurringIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
    const recurringExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);
    const mIncome = recurringIncome + (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
    const mExpense = recurringExpense + (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    const mNet = mIncome - mExpense;
    const mSavingsRate = mIncome > 0 ? Math.round((mNet / mIncome) * 100) : 0;

    const installmentsBalance = installments.reduce((s, inst) => {
      const remaining = inst.numPayments - inst.paidPayments;
      return s + remaining * (inst.totalAmount / inst.numPayments);
    }, 0);
    const mTotalDebt =
      mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0) +
      debts.reduce((s, d) => s + d.balance, 0) +
      installmentsBalance;

    const prevMonthsWithData = [1, 2, 3].filter((offset) => {
      const idx = ((currentMonth - offset) + 12) % 12;
      const prev = months[idx];
      return (prev?.income?.length ?? 0) > 0 || (prev?.expenses?.length ?? 0) > 0;
    }).length;

    const prevIncomes = [1, 2, 3].map((offset) => {
      const idx = ((currentMonth - offset) + 12) % 12;
      const prev = months[idx];
      return recurringIncome + (prev?.income ?? []).reduce((s, e) => s + e.amount, 0);
    });
    const avgIncome = prevIncomes.reduce((s, v) => s + v, 0) / 3;
    const mIncomeTrend = prevMonthsWithData >= 2 && avgIncome > 0
      ? Math.round(((mIncome - avgIncome) / avgIncome) * 100)
      : null;

    const prevExpenses = [1, 2, 3].map((offset) => {
      const idx = ((currentMonth - offset) + 12) % 12;
      const prev = months[idx];
      return recurringExpense + (prev?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    });
    const avgExpense = prevExpenses.reduce((s, v) => s + v, 0) / 3;
    const mExpenseTrend = prevMonthsWithData >= 2 && avgExpense > 0
      ? Math.round(((mExpense - avgExpense) / avgExpense) * 100)
      : null;

    return {
      monthlyIncome: mIncome, monthlyExpense: mExpense, net: mNet,
      savingsRate: mSavingsRate, totalDebt: mTotalDebt,
      incomeTrend: mIncomeTrend, expenseTrend: mExpenseTrend,
    };
  }, [months, recurringIncomes, recurringExpenses, installments, mortgages, debts, md, currentMonth]);

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
