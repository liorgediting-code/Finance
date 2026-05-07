import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { detectRecurringSuggestions } from '../../utils/recurringDetector';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';
import { HEBREW_MONTHS } from '../../config/months';

function RepeatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function RecurringDetectorBanner() {
  const { months, recurringExpenses } = useFinanceStore(useShallow((s) => ({
    months: s.months,
    recurringExpenses: s.recurringExpenses,
  })));
  const addRecurringExpense = useFinanceStore((s) => s.addRecurringExpense);

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  if (dismissed) return null;

  const suggestions = detectRecurringSuggestions(months, recurringExpenses);
  if (suggestions.length === 0) return null;

  const handleConvert = (idx: number) => {
    const s = suggestions[idx];
    const key = `${s.categoryId}:${s.description}`;
    setConverting(key);
    addRecurringExpense({
      date: new Date().toISOString().slice(0, 10),
      categoryId: s.categoryId,
      subcategoryId: s.subcategoryId,
      description: s.description,
      amount: s.averageAmount,
      paymentMethod: 'credit',
      notes: '',
      isRecurring: true,
    });
    setTimeout(() => setConverting(null), 800);
  };

  return (
    <div dir="rtl" className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
          <RepeatIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            זוהו {suggestions.length} הוצאות חוזרות שלא מוגדרות כקבועות
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            הוצאות שמופיעות 3+ חודשים ברצף — אולי כדאי להוסיפן לקבועות?
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setExpanded((o) => !o)}
            className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
          >
            {expanded ? 'סגור' : 'הצג'}
            <ChevronDownIcon open={expanded} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-800 cursor-pointer p-1 rounded-lg hover:bg-amber-100 transition-colors"
            title="סגור"
          >
            <XIcon />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {suggestions.map((s, i) => {
            const cat = CATEGORIES.find((c) => c.id === s.categoryId);
            const key = `${s.categoryId}:${s.description}`;
            const isConverting = converting === key;
            const monthsLabel = s.monthsFound.map((m) => HEBREW_MONTHS[m]).join(', ');

            return (
              <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-amber-100">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat?.color ?? '#B0A8C8' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E1E2E] truncate">
                    {s.description || cat?.nameHe || s.categoryId}
                  </p>
                  <p className="text-xs text-[#9090A8]">
                    {formatCurrency(s.averageAmount)} בממוצע • {monthsLabel}
                  </p>
                </div>
                <button
                  onClick={() => handleConvert(i)}
                  disabled={isConverting}
                  className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-60 transition-colors cursor-pointer font-medium flex-shrink-0"
                >
                  {isConverting ? 'נוסף!' : 'הפוך לקבוע'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
