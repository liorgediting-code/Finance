import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

interface PaymentItem {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  type: 'recurring' | 'installment';
}

function getCatName(catId: string): string {
  return CATEGORIES.find((c) => c.id === catId)?.nameHe ?? catId;
}

function PaymentList({ items, total, title, accent }: { items: PaymentItem[]; total: number; title: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: accent }}>
        <h2 className="text-sm font-semibold text-[#1E1E2E]">{title}</h2>
        <span className="text-sm font-bold text-[#5B52A0]">{formatCurrency(total)}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-[#9090A8] p-4 text-center">אין תשלומים קבועים מוגדרים</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#1E1E2E]">{p.description}</p>
                <p className="text-xs text-[#9090A8]">
                  {getCatName(p.categoryId)} · {p.type === 'installment' ? 'תשלומים' : 'קבוע'}
                </p>
              </div>
              <span className="text-sm font-semibold text-[#1E1E2E]">{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UpcomingPaymentsPage() {
  const { recurringExpenses } = useActiveBoardData();
  const installments = useFinanceStore((s) => s.installments);

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();

  const buildInstallmentPayments = (absMonthIdx: number): PaymentItem[] => {
    const targetLinear = currentYear * 12 + absMonthIdx;
    return installments
      .filter((inst) => {
        const instStart = inst.startYear * 12 + inst.startMonth - 1;
        const instEnd = instStart + inst.numPayments - 1;
        return targetLinear >= instStart && targetLinear <= instEnd;
      })
      .map((inst) => ({
        id: inst.id,
        description: inst.description,
        amount: inst.totalAmount / inst.numPayments,
        categoryId: inst.categoryId,
        type: 'installment' as const,
      }));
  };

  const baseRecurring: PaymentItem[] = recurringExpenses
    .filter((e) => e.linkedSourceType !== 'installment')
    .map((e) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      categoryId: e.categoryId,
      type: 'recurring' as const,
    }));

  const thisMonthItems = [...baseRecurring, ...buildInstallmentPayments(currentMonthIdx)];
  const thisMonthTotal = thisMonthItems.reduce((s, p) => s + p.amount, 0);

  const nextAbsIdx = currentMonthIdx + 1;
  const nextMonthIdx = nextAbsIdx % 12;
  const nextMonthYear = currentMonthIdx === 11 ? currentYear + 1 : currentYear;

  const nextMonthItems = [...baseRecurring, ...buildInstallmentPayments(nextAbsIdx)];
  const nextMonthTotal = nextMonthItems.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">תשלומים צפויים</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">סקירת תשלומים קבועים ועתידיים לפי חודש</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-lavender-light/50 border border-lavender rounded-xl p-3">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-1">החודש</p>
          <p className="text-lg font-black text-[#5B52A0]">{formatCurrency(thisMonthTotal)}</p>
          <p className="text-xs text-[#9090A8]">{thisMonthItems.length} תשלומים</p>
        </div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-1">חודש הבא</p>
          <p className="text-lg font-black text-[#6B6B8A]">{formatCurrency(nextMonthTotal)}</p>
          <p className="text-xs text-[#9090A8]">{nextMonthItems.length} תשלומים</p>
        </div>
      </div>

      <PaymentList
        items={thisMonthItems}
        total={thisMonthTotal}
        title={`${MONTH_NAMES[currentMonthIdx]} ${currentYear}`}
        accent="rgba(196,188,240,0.2)"
      />

      <PaymentList
        items={nextMonthItems}
        total={nextMonthTotal}
        title={`${MONTH_NAMES[nextMonthIdx]} ${nextMonthYear}`}
        accent="#f9fafb"
      />

      <p className="text-xs text-[#9090A8] text-center mt-2">
        * מבוסס על הוצאות קבועות ותשלומים פעילים. לא כולל הוצאות חד-פעמיות.
      </p>
    </div>
  );
}
