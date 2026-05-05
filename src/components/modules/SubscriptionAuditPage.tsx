import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

interface SubscriptionItem {
  id: string;
  description: string;
  amount: number;
  source: 'recurring' | 'monthly';
  monthIndex?: number;
  cancelUrl?: string;
  paymentMethod?: string;
  subcategoryId?: string;
}

const RISK_THRESHOLD_HIGH = 200;
const RISK_THRESHOLD_MED = 100;

function RiskBadge({ amount }: { amount: number }) {
  if (amount >= RISK_THRESHOLD_HIGH) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
        יקר
      </span>
    );
  }
  if (amount >= RISK_THRESHOLD_MED) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
        בינוני
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      סביר
    </span>
  );
}

export default function SubscriptionAuditPage() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const { months, recurringExpenses } = useActiveBoardData();

  const year = settings.year;
  const currentMonthIndex = new Date().getMonth();

  // Gather subscriptions from recurring expenses
  const fromRecurring: SubscriptionItem[] = recurringExpenses
    .filter((e) => e.categoryId === 'subscriptions')
    .map((e) => ({
      id: e.id,
      description: e.description || e.subcategoryId || 'מנוי',
      amount: e.amount,
      source: 'recurring' as const,
      cancelUrl: e.cancelUrl,
      paymentMethod: e.paymentMethod,
      subcategoryId: e.subcategoryId,
    }));

  // Gather non-recurring subscription expenses from current + past months
  const seenDescriptions = new Set(fromRecurring.map((s) => s.description.toLowerCase()));
  const fromMonthly: SubscriptionItem[] = [];

  for (let m = 0; m <= currentMonthIndex; m++) {
    const md = months[m];
    if (!md) continue;
    for (const e of md.expenses) {
      if (e.categoryId !== 'subscriptions') continue;
      if (e.isRecurring) continue;
      const key = e.description.toLowerCase();
      if (seenDescriptions.has(key)) continue;
      seenDescriptions.add(key);
      fromMonthly.push({
        id: e.id,
        description: e.description || e.subcategoryId || 'מנוי',
        amount: e.amount,
        source: 'monthly' as const,
        monthIndex: m,
        cancelUrl: e.cancelUrl,
        paymentMethod: e.paymentMethod,
        subcategoryId: e.subcategoryId,
      });
    }
  }

  const allSubs = [...fromRecurring, ...fromMonthly].sort((a, b) => b.amount - a.amount);

  const recurringMonthly = fromRecurring.reduce((s, e) => s + e.amount, 0);
  const totalMonthly = allSubs.reduce((s, e) => s + e.amount, 0);
  const totalAnnual = recurringMonthly * 12;
  const expensiveCount = allSubs.filter((s) => s.amount >= RISK_THRESHOLD_HIGH).length;

  const paymentMethodLabel: Record<string, string> = {
    credit: 'אשראי',
    cash: 'מזומן',
    transfer: 'העברה',
    check: "צ'ק",
    direct_debit: 'הוראת קבע',
  };

  const hasSubs = allSubs.length > 0;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">ביקורת מנויים</h1>
        <p className="text-sm text-[#9090A8] mt-1">סקירת כל המנויים החודשיים שלך וחשיפת עלויות מיותרות</p>
      </div>

      {/* Summary strip */}
      {hasSubs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'סה"כ חודשי', value: formatCurrency(totalMonthly), color: '#7B6DC8' },
            { label: 'קבועים בחודש', value: formatCurrency(recurringMonthly), color: '#4A90C0' },
            { label: 'עלות שנתית', value: formatCurrency(totalAnnual), color: '#E06060' },
            { label: 'מנויים יקרים', value: String(expensiveCount), color: expensiveCount > 0 ? '#E06060' : '#22C55E' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-1 w-full" style={{ backgroundColor: stat.color }} />
              <div className="p-3">
                <p className="text-[10px] font-semibold text-[#9090A8] uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-[#1E1E2E]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insight banner */}
      {expensiveCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">
              {expensiveCount} מנוי{expensiveCount > 1 ? 'ים' : ''} עולה{expensiveCount > 1 ? 'ים' : ''} מעל ₪{RISK_THRESHOLD_HIGH} בחודש
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              שקול לבטל מנויים שאינך משתמש בהם. עלות שנתית כוללת: {formatCurrency(totalAnnual)}
            </p>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: '#7B6DC8' }} />
        <div className="p-5">
          <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-4">
            רשימת מנויים ({allSubs.length})
          </h2>

          {!hasSubs && (
            <p className="text-sm text-[#9090A8] text-center py-6">
              לא נמצאו מנויים. הוסף הוצאות בקטגוריה "מנויים ואפליקציות".
            </p>
          )}

          <div className="divide-y divide-gray-50">
            {allSubs.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-[#1E1E2E] truncate">{sub.description}</p>
                    <RiskBadge amount={sub.amount} />
                    {sub.source === 'recurring' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">קבוע</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {sub.paymentMethod && (
                      <p className="text-[11px] text-[#9090A8]">{paymentMethodLabel[sub.paymentMethod] ?? sub.paymentMethod}</p>
                    )}
                    {sub.cancelUrl && (
                      <a
                        href={sub.cancelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-500 hover:underline"
                      >
                        ביטול →
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <p className="text-base font-bold text-[#1E1E2E]">{formatCurrency(sub.amount)}</p>
                  <p className="text-[10px] text-[#9090A8]">{formatCurrency(sub.amount * 12)} / שנה</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tips */}
      {hasSubs && (
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ backgroundColor: '#C5CDB6' }} />
          <div className="p-5">
            <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
              💡 טיפים לחיסכון
            </h2>
            <ul className="space-y-2">
              {[
                'עבור לתשלום שנתי כשמתאפשר — בדרך כלל חוסך 15-20%',
                'בדוק האם כמה בני משפחה יכולים לשתף מנוי אחד (Family Plan)',
                'בטל מנויים שלא השתמשת בהם ב-30 הימים האחרונים',
                'השתמש בניסיונות חינם לפני הרשמה למנוי חדש',
                'השווה בין מנויים דומים — לעיתים קיימת אלטרנטיבה זולה יותר',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#4A4A60]">
                  <span className="text-[#7B6DC8] font-bold flex-shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="text-xs text-[#9090A8] text-center">
        שנה: {year} · נתונים מבוססים על הוצאות בקטגוריה "מנויים ואפליקציות"
      </p>
    </div>
  );
}
