import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// Approximate month indices for Israeli holidays (0-based, Gregorian)
const CHAGIM_BY_MONTH: Record<number, { name: string; emoji: string }[]> = {
  2: [{ name: 'פורים', emoji: '🎭' }],
  3: [{ name: 'פסח', emoji: '🫓' }],
  5: [{ name: 'שבועות', emoji: '📜' }],
  8: [{ name: 'ראש השנה', emoji: '🍎' }, { name: 'יום כיפור', emoji: '🕍' }],
  9: [{ name: 'סוכות', emoji: '🌿' }],
  11: [{ name: 'חנוכה', emoji: '🕎' }],
};

export default function ChagimPlannerPage() {
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthData = months[i];
    const expenses = (monthData?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
    const recurringExp = recurringExpenses.reduce((s, e) => s + e.amount, 0);
    const incomes = (monthData?.income ?? []).reduce((s, inc) => s + inc.amount, 0);
    const recurringInc = recurringIncomes.reduce((s, inc) => s + inc.amount, 0);
    const totalExpenses = expenses + recurringExp;
    const totalIncome = incomes + recurringInc;
    const chagim = CHAGIM_BY_MONTH[i] ?? [];
    return { expenses: totalExpenses, income: totalIncome, net: totalIncome - totalExpenses, chagim };
  });

  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const chagMonths = Object.keys(CHAGIM_BY_MONTH).map(Number);

  const maxExpenses = Math.max(...monthlyData.map((m) => m.expenses), 1);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">מתכנן שנתי</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">סקירה שנתית של הכנסות והוצאות עם סימון חגים ישראליים</p>
      </div>

      {/* Annual summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-sage-dark" />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">הכנסות שנתיות</p>
            <p className="text-lg font-bold text-sage-dark">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-red-400" />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">הוצאות שנתיות</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-lavender-dark" />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">יתרה שנתית</p>
            <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-sage-dark' : 'text-red-500'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {monthlyData.map((data, i) => {
          const isCurrentMonth = i === currentMonth;
          const hasCurrent = data.expenses > 0 || data.income > 0;
          const barWidth = maxExpenses > 0 ? Math.round((data.expenses / maxExpenses) * 100) : 0;
          const isChagMonth = chagMonths.includes(i);

          return (
            <div
              key={i}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isCurrentMonth ? 'border-lavender-dark ring-1 ring-lavender-dark' : isChagMonth ? 'border-[#C89E50]/40' : 'border-gray-100'}`}
            >
              {isChagMonth && <div className="h-1 bg-[#C89E50]" />}
              {isCurrentMonth && !isChagMonth && <div className="h-1 bg-lavender-dark" />}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-[#5B52A0]' : 'text-[#1E1E2E]'}`}>
                      {MONTH_NAMES[i]}
                    </span>
                    {isCurrentMonth && (
                      <span className="text-[10px] bg-lavender-light text-[#5B52A0] px-1.5 py-0.5 rounded-full font-medium">נוכחי</span>
                    )}
                  </div>
                  <span className="text-xs text-[#9090A8]">{currentYear}</span>
                </div>

                {/* Chag badges */}
                {data.chagim.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-2">
                    {data.chagim.map((c) => (
                      <span key={c.name} className="text-[10px] bg-amber-50 text-[#B08A40] border border-amber-200 px-1.5 py-0.5 rounded-full">
                        {c.emoji} {c.name}
                      </span>
                    ))}
                  </div>
                )}

                {hasCurrent ? (
                  <>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#9090A8]">הכנסות</span>
                        <span className="font-medium text-sage-dark">{formatCurrency(data.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9090A8]">הוצאות</span>
                        <span className="font-medium text-red-500">{formatCurrency(data.expenses)}</span>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${barWidth}%`,
                          backgroundColor: data.expenses > data.income ? '#E06060' : '#5A9A42',
                        }}
                      />
                    </div>
                    <div className={`text-xs font-semibold mt-1.5 ${data.net >= 0 ? 'text-sage-dark' : 'text-red-500'}`}>
                      {data.net >= 0 ? '+' : ''}{formatCurrency(data.net)}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[#C0C0D0] mt-1">אין נתונים</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chag expense insights */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3">חודשי חגים — השוואה</h3>
        <div className="space-y-2">
          {chagMonths.map((i) => {
            const data = monthlyData[i];
            const avgNonChag = monthlyData
              .filter((_, idx) => !chagMonths.includes(idx) && monthlyData[idx].expenses > 0)
              .reduce((s, m, _, arr) => s + m.expenses / arr.length, 0);
            const diff = data.expenses - avgNonChag;
            const hasData = data.expenses > 0;

            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-24 flex-shrink-0">
                  <span className="text-sm font-medium text-[#1E1E2E]">{MONTH_NAMES[i]}</span>
                  <div className="flex gap-0.5 mt-0.5">
                    {(CHAGIM_BY_MONTH[i] ?? []).map((c) => (
                      <span key={c.name} className="text-[10px] text-[#C89E50]">{c.emoji}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  {hasData ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1E1E2E]">{formatCurrency(data.expenses)}</span>
                      {avgNonChag > 0 && diff > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          +{formatCurrency(diff)} מהממוצע
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#C0C0D0]">אין נתונים</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category breakdown hint */}
      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-xs text-[#B08A40]">
          💡 <strong>טיפ:</strong> בחודשי חגים (ספטמבר-אוקטובר, מרץ-אפריל) מומלץ לתכנן תקציב מיוחד לקטגוריות
          <span className="font-medium"> מזון, קניות ובידור</span>. השתמש ב"תקציב חגים" לפירוט.
        </p>
      </div>
    </div>
  );
}
