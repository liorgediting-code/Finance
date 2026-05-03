import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

function getCatName(catId: string): string {
  return CATEGORIES.find((c) => c.id === catId)?.nameHe ?? catId;
}

export default function SubscriptionAuditPage() {
  const { recurringExpenses, months } = useActiveBoardData();

  const now = new Date();
  const currentMonthIdx = now.getMonth();

  // All recurring expenses that are not auto-linked from other modules
  const recurringBase = recurringExpenses.filter((e) => !e.linkedSourceId);

  // Also pick up month expenses marked as recurring (subscriptions in current month)
  const thisMonthRecurring = (months[currentMonthIdx]?.expenses ?? []).filter(
    (e) => e.isRecurring && !recurringBase.find((r) => r.id === e.id)
  );

  const allSubscriptions = [...recurringBase, ...thisMonthRecurring];

  const monthlyTotal = allSubscriptions.reduce((s, sub) => s + sub.amount, 0);
  const annualTotal = monthlyTotal * 12;

  const sorted = [...allSubscriptions].sort((a, b) => b.amount - a.amount);

  // Group by category
  const byCategory: Record<string, typeof sorted> = {};
  for (const sub of sorted) {
    if (!byCategory[sub.categoryId]) byCategory[sub.categoryId] = [];
    byCategory[sub.categoryId].push(sub);
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">ביקורת מנויים</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">כל ההוצאות הקבועות והמנויים שלך — כמה הם עולים בשנה?</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-1">עלות חודשית</p>
          <p className="text-xl font-black text-[#1E1E2E]">{formatCurrency(monthlyTotal)}</p>
          <p className="text-xs text-[#9090A8] mt-0.5">{allSubscriptions.length} מנויים</p>
        </div>
        <div className="bg-blush-light border border-blush rounded-xl p-4">
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-1">עלות שנתית</p>
          <p className="text-xl font-black text-blush-dark">{formatCurrency(annualTotal)}</p>
          <p className="text-xs text-[#9090A8] mt-0.5">אם ממשיכים כך</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium text-[#1E1E2E]">אין מנויים מוגדרים</p>
          <p className="text-xs text-[#9090A8] mt-1">
            הוסף הוצאות קבועות בלוח הבקרה החודשי ורשום אותן כ״קבוע״
          </p>
        </div>
      ) : (
        <>
          {/* Full list */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-[#1E1E2E]">כל המנויים — מהיקר לזול</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {sorted.map((sub, idx) => (
                <div key={sub.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-bold text-[#9090A8] w-5 text-center">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E1E2E] truncate">{sub.description}</p>
                    <p className="text-xs text-[#9090A8]">{getCatName(sub.categoryId)}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="text-sm font-semibold text-[#1E1E2E]">{formatCurrency(sub.amount)}<span className="text-xs font-normal text-[#9090A8]">/חודש</span></p>
                    <p className="text-xs text-blush-dark">{formatCurrency(sub.amount * 12)}/שנה</p>
                  </div>
                  {sub.cancelUrl && (
                    <a
                      href={sub.cancelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#5B52A0] hover:underline flex-shrink-0"
                    >
                      ביטול
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-[#1E1E2E]">סה״כ</span>
              <div className="text-left">
                <span className="text-sm font-bold text-[#5B52A0]">{formatCurrency(monthlyTotal)}/חודש</span>
                <span className="text-xs text-[#9090A8] mr-2">({formatCurrency(annualTotal)}/שנה)</span>
              </div>
            </div>
          </div>

          {/* By category breakdown */}
          {Object.keys(byCategory).length > 1 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-4">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-[#1E1E2E]">לפי קטגוריה</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {Object.entries(byCategory)
                  .map(([catId, items]) => ({
                    catId,
                    total: items.reduce((s, i) => s + i.amount, 0),
                    count: items.length,
                  }))
                  .sort((a, b) => b.total - a.total)
                  .map(({ catId, total, count }) => (
                    <div key={catId} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#1E1E2E]">{getCatName(catId)}</p>
                        <p className="text-xs text-[#9090A8]">{count} מנויים</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#1E1E2E]">{formatCurrency(total)}/חודש</p>
                        <p className="text-xs text-[#9090A8]">{formatCurrency(total * 12)}/שנה</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tip */}
          {monthlyTotal > 300 && sorted.length > 0 && (
            <div className="bg-honey-light border border-honey rounded-xl p-4">
              <p className="text-sm font-semibold text-[#1E1E2E] mb-1">💡 טיפ לחיסכון</p>
              <p className="text-xs text-[#6B6B8A] leading-relaxed">
                ביטול המנוי היקר ביותר ({sub_description(sorted[0]?.description ?? '')} —{' '}
                {formatCurrency(sorted[0]?.amount ?? 0)}/חודש) יחסוך לך{' '}
                {formatCurrency((sorted[0]?.amount ?? 0) * 12)} בשנה. בדוק כל מנוי ושאל את עצמך — האם אני משתמש בזה לפחות פעם בשבוע?
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function sub_description(desc: string): string {
  return desc.length > 20 ? desc.slice(0, 20) + '…' : desc;
}
