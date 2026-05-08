import { useState } from 'react';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { HEBREW_MONTHS } from '../../config/months';
import { CATEGORIES } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';
import { computeMonthTotals } from '../../utils/monthlyTotals';
import { useFinanceStore } from '../../store/useFinanceStore';

interface Props {
  monthIndex: number;
  onClose: () => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  home: '🏠', food: '🍕', transport: '🚗', children: '👶',
  health: '💊', personal: '✂️', entertainment: '🎭',
  subscriptions: '📺', shopping: '🛍️', education: '📚',
  pets: '🐾', financial: '🏦', savings: '💰',
  investments: '📈', holidays: '🕍', other: '📦',
};

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ShareSummaryModal({ monthIndex, onClose }: Props) {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);
  const [copied, setCopied] = useState(false);

  const monthData = months[monthIndex];
  const { totalIncome, totalExpenses, net } = computeMonthTotals(monthData, recurringIncomes, recurringExpenses);

  const allExpenses = [...recurringExpenses, ...(monthData?.expenses ?? [])].filter((e) => !e.isPending);
  const catTotals: Record<string, number> = {};
  allExpenses.forEach((e) => {
    catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + e.amount;
  });

  const topCategories = CATEGORIES
    .map((cat) => ({ cat, amount: catTotals[cat.id] ?? 0 }))
    .filter((r) => r.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const monthName = HEBREW_MONTHS[monthIndex];
  const isPositive = net >= 0;
  const savingsRate = totalIncome > 0 ? Math.round((net / totalIncome) * 100) : 0;

  const summaryText = [
    `📊 *סיכום פיננסי — ${monthName} ${year}*`,
    ``,
    `💰 הכנסות: ${formatCurrency(totalIncome)}`,
    `💸 הוצאות: ${formatCurrency(totalExpenses)}`,
    `${isPositive ? '💚' : '🔴'} *יתרה: ${isPositive ? '+' : ''}${formatCurrency(net)}*`,
    totalIncome > 0 ? `📈 שיעור חיסכון: ${savingsRate}%` : '',
    ``,
    `📋 *הוצאות עיקריות:*`,
    ...topCategories.map((r) => `${CATEGORY_EMOJIS[r.cat.id] ?? '📦'} ${r.cat.nameHe}: ${formatCurrency(r.amount)}`),
    ``,
    isPositive ? '✅ חודש ירוק! הכנסות עלו על ההוצאות 🎉' : '⚠️ הוצאות עלו על ההכנסות החודש',
    ``,
    `_נוצר ב-בית פלוס — ניהול פיננסי חכם_`,
  ].filter((line) => line !== null) as string[];

  const textToCopy = summaryText.join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#1E1E2E]">📤 שיתוף סיכום חודשי</h2>
            <p className="text-xs text-[#9090A8] mt-0.5">{monthName} {year}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9090A8] hover:bg-gray-100 hover:text-[#1E1E2E] transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-[#F2F3F7] rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-[#1E1E2E] select-all" dir="rtl">
            {textToCopy}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            onClick={handleCopy}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              copied
                ? 'bg-sage-light text-sage-dark'
                : 'bg-lavender-dark text-white hover:bg-[#5B52A0]'
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? 'הועתק!' : 'העתק ללוח'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#9090A8] hover:bg-gray-100 transition-colors cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}
