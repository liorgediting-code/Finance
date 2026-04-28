import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

interface DeltaRowProps {
  label: string;
  current: number;
  prev: number;
  positiveIsGood: boolean;
}

function DeltaRow({ label, current, prev, positiveIsGood }: DeltaRowProps) {
  const delta = current - prev;
  const hasData = prev > 0 || current > 0;
  const pct = prev > 0 ? Math.round((delta / prev) * 100) : null;

  let deltaColor = 'text-[#9090A8]';
  if (hasData && delta !== 0) {
    const isGood = positiveIsGood ? delta > 0 : delta < 0;
    deltaColor = isGood ? 'text-[#3A7A3A]' : 'text-[#9A3A3A]';
  }

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-[#6B6B8A]">{label}</span>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#1E1E2E] font-medium">{formatCurrency(current)}</span>
        {hasData && delta !== 0 && (
          <span className={`font-semibold ${deltaColor}`}>
            {delta > 0 ? '▲' : '▼'} {pct !== null ? `${Math.abs(pct)}%` : formatCurrency(Math.abs(delta))}
          </span>
        )}
        {hasData && delta === 0 && (
          <span className="text-[#9090A8]">ללא שינוי</span>
        )}
      </div>
    </div>
  );
}

export default function MonthComparisonCard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const hiddenSections = useFinanceStore((s) => s.settings.hiddenDashboardSections ?? []);

  if (hiddenSections.includes('month-comparison')) return null;

  const currentMonth = new Date().getMonth();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const MONTH_NAMES = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
  ];

  const recurIncome = recurringIncomes.reduce((s, e) => s + e.amount, 0);
  const recurExpense = recurringExpenses.reduce((s, e) => s + e.amount, 0);

  const mdCur = months[currentMonth];
  const mdPrev = months[prevMonth];

  const curIncome = recurIncome + (mdCur?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const curExpense = recurExpense + (mdCur?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const curNet = curIncome - curExpense;

  const prevIncome = recurIncome + (mdPrev?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const prevExpense = recurExpense + (mdPrev?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const prevNet = prevIncome - prevExpense;

  const hasPrevData = (mdPrev?.income?.length ?? 0) > 0 || (mdPrev?.expenses?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">
            השוואה חודשית
          </span>
        </div>
        <span className="text-[10px] text-[#9090A8]">
          {hasPrevData ? `לעומת ${MONTH_NAMES[prevMonth]}` : 'חודש נוכחי'}
        </span>
      </div>

      <div className="mb-1">
        <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-1">
          {MONTH_NAMES[currentMonth]}
        </p>
        <DeltaRow label="הכנסות" current={curIncome} prev={prevIncome} positiveIsGood={true} />
        <DeltaRow label="הוצאות" current={curExpense} prev={prevExpense} positiveIsGood={false} />
        <DeltaRow label="חיסכון נטו" current={curNet} prev={prevNet} positiveIsGood={true} />
      </div>

      {!hasPrevData && (
        <p className="text-[10px] text-[#9090A8] mt-2">
          הזן נתוני חודש קודם כדי לראות השוואה
        </p>
      )}
    </div>
  );
}
