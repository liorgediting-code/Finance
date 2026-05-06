import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

function Shield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function calcAvgMonthlyExpenses(months: Record<number, { expenses: { amount: number }[] }>, recurringExpenses: { amount: number }[]): number {
  const populated = Object.values(months).filter((m) => m.expenses.length > 0);
  if (populated.length === 0) {
    return recurringExpenses.reduce((s, e) => s + e.amount, 0);
  }
  const total = populated.reduce((s, m) => s + m.expenses.reduce((es, e) => es + e.amount, 0), 0);
  return Math.round(total / populated.length);
}

export default function EmergencyFundPage() {
  const { savingsFunds, settings, months, recurringExpenses, updateSettings } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      settings: s.settings,
      months: s.months,
      recurringExpenses: s.recurringExpenses,
      updateSettings: s.updateSettings,
    }))
  );

  const emergencyFundId = settings.emergencyFundId;
  const emergencyFund = savingsFunds.find((f) => f.id === emergencyFundId);
  const avgMonthlyExpenses = calcAvgMonthlyExpenses(months, recurringExpenses);
  const monthsCovered = emergencyFund && avgMonthlyExpenses > 0
    ? emergencyFund.savedAmount / avgMonthlyExpenses
    : 0;

  const target3 = avgMonthlyExpenses * 3;
  const target6 = avgMonthlyExpenses * 6;
  const pct3 = Math.min(100, emergencyFund && avgMonthlyExpenses > 0 ? (emergencyFund.savedAmount / target3) * 100 : 0);
  const pct6 = Math.min(100, emergencyFund && avgMonthlyExpenses > 0 ? (emergencyFund.savedAmount / target6) * 100 : 0);

  const getStatus = () => {
    if (monthsCovered >= 6) return { label: 'מצוין! 6+ חודשים', color: '#5A9A42', bg: '#F0F7EC' };
    if (monthsCovered >= 3) return { label: 'בסיסי — עדיף 6 חודשים', color: '#C89E50', bg: '#FDF8EC' };
    if (monthsCovered >= 1) return { label: 'דרוש שיפור', color: '#E06060', bg: '#FDF0F0' };
    return { label: 'קרן חירום לא מוגדרת', color: '#9090A8', bg: '#F5F5FA' };
  };

  const status = getStatus();

  const tips = [
    'קרן חירום מומלצת: 3–6 חודשי הוצאות',
    'שמור את הקרן בחשבון נגיש — לא בהשקעות',
    'הפרד קרן חירום מחסכונות אחרים',
    'גדל את הקרן לפני שמגדיל השקעות',
    'חדש את הקרן מיד לאחר שימוש בה',
  ];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-[#4AACAC]"><Shield /></div>
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">קרן חירום</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">הגנה פיננסית לרגעי בלתי מצופים</p>
        </div>
      </div>

      {/* Status banner */}
      <div className="rounded-xl p-4 mb-5 flex items-center gap-3" style={{ backgroundColor: status.bg }}>
        <div className="text-3xl">
          {monthsCovered >= 6 ? '🛡️' : monthsCovered >= 3 ? '⚠️' : '🚨'}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: status.color }}>{status.label}</p>
          {avgMonthlyExpenses > 0 && (
            <p className="text-xs text-[#6B6B8A] mt-0.5">
              ממוצע הוצאות חודשי: {formatCurrency(avgMonthlyExpenses)}
            </p>
          )}
          {emergencyFund && (
            <p className="text-xs font-medium mt-0.5" style={{ color: status.color }}>
              כיסוי נוכחי: {monthsCovered.toFixed(1)} חודשים
            </p>
          )}
        </div>
      </div>

      {/* Fund selector */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-3">בחר קרן חיסכון כקרן חירום</p>
        {savingsFunds.length === 0 ? (
          <p className="text-sm text-[#9090A8]">אין קרנות חיסכון — צור קרן בדף החסכונות תחילה</p>
        ) : (
          <div className="space-y-2">
            {savingsFunds.map((fund) => (
              <label
                key={fund.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${fund.id === emergencyFundId ? 'border-[#4AACAC] bg-[#F0FAFA]' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <input
                  type="radio"
                  name="emergencyFund"
                  checked={fund.id === emergencyFundId}
                  onChange={() => updateSettings({ emergencyFundId: fund.id })}
                  className="accent-[#4AACAC]"
                />
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fund.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E1E2E]">{fund.name}</p>
                  <p className="text-xs text-[#9090A8]">{formatCurrency(fund.savedAmount)}</p>
                </div>
                {fund.id === emergencyFundId && (
                  <span className="text-xs bg-[#4AACAC] text-white px-2 py-0.5 rounded-full">נבחרה</span>
                )}
              </label>
            ))}
            {emergencyFundId && (
              <button
                onClick={() => updateSettings({ emergencyFundId: undefined })}
                className="text-xs text-[#9090A8] hover:text-red-500 mt-1 cursor-pointer"
              >
                בטל בחירה
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bars */}
      {avgMonthlyExpenses > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
          <p className="text-sm font-semibold text-[#1E1E2E] mb-4">התקדמות לעבר היעד</p>
          <div className="space-y-5">
            {/* 3-month target */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#6B6B8A]">יעד מינימלי — 3 חודשים</span>
                <span className="font-semibold text-[#1E1E2E]">{formatCurrency(target3)}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct3}%`, backgroundColor: pct3 >= 100 ? '#5A9A42' : '#C89E50' }}
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1 text-[#9090A8]">
                <span>{emergencyFund ? formatCurrency(emergencyFund.savedAmount) : '₪0'}</span>
                <span>{pct3.toFixed(0)}%</span>
              </div>
            </div>

            {/* 6-month target */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-[#6B6B8A]">יעד מומלץ — 6 חודשים</span>
                <span className="font-semibold text-[#1E1E2E]">{formatCurrency(target6)}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct6}%`, backgroundColor: pct6 >= 100 ? '#5A9A42' : '#4AACAC' }}
                />
              </div>
              <div className="flex justify-between text-[10px] mt-1 text-[#9090A8]">
                <span>{emergencyFund ? formatCurrency(emergencyFund.savedAmount) : '₪0'}</span>
                <span>{pct6.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {emergencyFund && pct6 < 100 && avgMonthlyExpenses > 0 && (
            <div className="mt-4 p-3 bg-[#F0FAFA] rounded-lg border border-[#4AACAC]/30">
              <p className="text-xs text-[#4AACAC] font-medium">
                כדי להגיע ל-6 חודשים תוך שנה, עליך לחסוך{' '}
                {formatCurrency(Math.max(0, Math.ceil((target6 - emergencyFund.savedAmount) / 12)))}/חודש
              </p>
            </div>
          )}
        </div>
      )}

      {avgMonthlyExpenses === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-4 border border-amber-200">
          <p className="text-sm text-amber-700">
            💡 הזן הוצאות חודשיות כדי לחשב את יעד קרן החירום שלך
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <p className="text-sm font-semibold text-[#1E1E2E] mb-3">טיפים לקרן חירום בריאה</p>
        <ul className="space-y-2">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#6B6B8A]">
              <span className="text-[#4AACAC] mt-0.5 flex-shrink-0">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
