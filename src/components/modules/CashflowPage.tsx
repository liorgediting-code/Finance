import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function MonthLabel(monthIndex: number, year: number): string {
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

export default function CashflowPage() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const installments = useFinanceStore((s) => s.installments);

  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  const [startingBalance, setStartingBalance] = useState(0);
  const [horizonMonths, setHorizonMonths] = useState(6);

  const getMonthData = (monthOffset: number) => {
    const absMonthIndex = currentMonthIndex + monthOffset;
    const mIdx = absMonthIndex % 12;
    const yr = currentYear + Math.floor(absMonthIndex / 12);
    const monthData = months[absMonthIndex];
    const recurringIncome = recurringIncomes.reduce((s, inc) => s + inc.amount, 0);
    // Exclude installment-linked entries — handled separately with date-awareness below
    const recurringExpense = recurringExpenses
      .filter((e) => e.linkedSourceType !== 'installment')
      .reduce((s, exp) => s + exp.amount, 0);
    const manualIncome = (monthData?.income ?? []).reduce((s, inc) => s + inc.amount, 0);
    // No isRecurring filter — subscriptions live only in months[x].expenses, not in recurringExpenses
    const manualExpense = (monthData?.expenses ?? []).reduce((s, exp) => s + exp.amount, 0);

    const targetLinear = currentYear * 12 + absMonthIndex;
    const installmentPayments = installments
      .filter((inst) => {
        const instStart = inst.startYear * 12 + inst.startMonth - 1;
        const instEnd = instStart + inst.numPayments - 1;
        return targetLinear >= instStart && targetLinear <= instEnd;
      })
      .reduce((s, inst) => s + inst.totalAmount / inst.numPayments, 0);

    const totalIncome = recurringIncome + manualIncome;
    const totalExpenses = recurringExpense + manualExpense + installmentPayments;
    return {
      label: MonthLabel(mIdx, yr),
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
    };
  };

  const projections = Array.from({ length: horizonMonths }, (_, i) => getMonthData(i));

  let runningBalance = startingBalance;
  const withBalance = projections.map((p) => {
    runningBalance += p.net;
    return { ...p, balance: runningBalance };
  });

  const lowestBalance = Math.min(...withBalance.map((p) => p.balance));
  const firstNegative = withBalance.findIndex((p) => p.balance < 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">תחזית תזרים מזומנים</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">צפי להכנסות והוצאות חודשיות בהתבסס על פריטים קבועים</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יתרת פתיחה (₪)</label>
            <input
              type="number"
              value={startingBalance || ''}
              onChange={(e) => setStartingBalance(Number(e.target.value))}
              placeholder="0"
              className="border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
            />
            <p className="text-xs text-[#9090A8] mt-1">יתרת חשבון הבנק הנוכחית</p>
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">אופק תחזית</label>
            <div className="flex gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizonMonths(m)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium cursor-pointer border transition-colors ${horizonMonths === m ? 'bg-lavender-dark text-white border-lavender-dark' : 'border-gray-200 text-[#6B6B8A] hover:bg-gray-50'}`}
                >
                  {m} חודשים
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary alerts */}
      {firstNegative !== -1 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">יתרה שלילית צפויה</p>
            <p className="text-xs text-red-600 mt-0.5">
              בחודש {withBalance[firstNegative].label} הצפי יגיע ל-{formatCurrency(withBalance[firstNegative].balance)}
            </p>
          </div>
        </div>
      )}

      {lowestBalance >= 0 && startingBalance > 0 && (
        <div className="bg-sage-light border border-sage rounded-xl p-3 mb-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">✅</span>
          <div>
            <p className="text-sm font-semibold text-sage-dark">תזרים חיובי</p>
            <p className="text-xs text-sage-dark mt-0.5">
              היתרה המינימלית הצפויה: {formatCurrency(lowestBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Monthly projection table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-4 gap-2 text-xs font-semibold text-[#6B6B8A]">
          <span>חודש</span>
          <span className="text-left">הכנסות</span>
          <span className="text-left">הוצאות</span>
          <span className="text-left">יתרה</span>
        </div>
        <div className="divide-y divide-gray-50">
          {withBalance.map((row, idx) => {
            const isNegative = row.balance < 0;
            const isFirst = idx === 0;
            return (
              <div
                key={idx}
                className={`px-4 py-3 grid grid-cols-4 gap-2 text-sm ${isFirst ? 'bg-lavender-light/30' : ''} ${isNegative ? 'bg-red-50' : ''}`}
              >
                <span className={`font-medium ${isFirst ? 'text-[#5B52A0]' : 'text-[#1E1E2E]'}`}>
                  {row.label}
                  {isFirst && <span className="text-[10px] text-[#9090A8] block">נוכחי</span>}
                </span>
                <span className="text-sage-dark font-medium text-left">{formatCurrency(row.income)}</span>
                <span className="text-red-500 font-medium text-left">{formatCurrency(row.expenses)}</span>
                <span className={`font-bold text-left ${isNegative ? 'text-red-600' : row.balance > startingBalance ? 'text-sage-dark' : 'text-[#1E1E2E]'}`}>
                  {formatCurrency(row.balance)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[#9090A8] mt-3 text-center">
        * התחזית מבוססת על הכנסות והוצאות קבועות בלבד. תשלומים חד-פעמיים אינם כלולים.
      </p>
    </div>
  );
}
