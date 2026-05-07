import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { computeMonthTotals } from '../../utils/monthlyTotals';
import type { WishlistPriority } from '../../types';

const PRIORITY_LABELS: Record<WishlistPriority, { label: string; color: string }> = {
  high:   { label: 'גבוהה', color: 'bg-red-100 text-red-700' },
  medium: { label: 'בינונית', color: 'bg-amber-100 text-amber-700' },
  low:    { label: 'נמוכה', color: 'bg-gray-100 text-[#6B6B8A]' },
};

const EMOJI_OPTIONS = ['🛍️', '🏠', '🚗', '✈️', '💻', '📱', '🎸', '🏋️', '📚', '🎮', '👟', '⌚', '🎁', '🛋️', '🏖️'];

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#9090A8]';

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
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

function AffordabilityBadge({ months, monthlySurplus }: { months: number | null; monthlySurplus: number }) {
  if (monthlySurplus <= 0) {
    return <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">אין עודף חודשי</span>;
  }
  if (months === null || months > 36) {
    return <span className="text-xs text-[#9090A8] bg-gray-50 px-2 py-0.5 rounded-full">טווח ארוך</span>;
  }
  if (months <= 1) {
    return <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">ניתן לרכוש עכשיו</span>;
  }
  return (
    <span className="text-xs text-lavender-dark bg-lavender-light px-2 py-0.5 rounded-full">
      כ-{months} חודשים
    </span>
  );
}

export default function WishlistPage() {
  const wishlist = useFinanceStore(useShallow((s) => s.wishlist));
  const addWishlistItem = useFinanceStore((s) => s.addWishlistItem);
  const deleteWishlistItem = useFinanceStore((s) => s.deleteWishlistItem);
  const markWishlistPurchased = useFinanceStore((s) => s.markWishlistPurchased);
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();

  // Compute average monthly surplus from last 3 months
  const currentMonth = new Date().getMonth();
  const surplusSamples: number[] = [];
  for (let i = 1; i <= 3; i++) {
    const mi = ((currentMonth - i) + 12) % 12;
    const md = months[mi];
    if (!md) continue;
    const totals = computeMonthTotals(md, recurringIncomes, recurringExpenses);
    const surplus = totals.totalIncome - totals.totalExpenses;
    if (surplus > 0) surplusSamples.push(surplus);
  }
  const monthlySurplus = surplusSamples.length > 0
    ? surplusSamples.reduce((s, v) => s + v, 0) / surplusSamples.length
    : 0;

  const [showForm, setShowForm] = useState(false);
  const [showPurchased, setShowPurchased] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cost: '',
    emoji: '🛍️',
    priority: 'medium' as WishlistPriority,
    notes: '',
    targetDate: '',
  });

  const resetForm = () => setForm({ name: '', cost: '', emoji: '🛍️', priority: 'medium', notes: '', targetDate: '' });

  const handleAdd = () => {
    const cost = parseFloat(form.cost);
    if (!form.name.trim() || !cost || cost <= 0) return;
    addWishlistItem({
      name: form.name.trim(),
      cost,
      emoji: form.emoji,
      priority: form.priority,
      notes: form.notes.trim(),
      targetDate: form.targetDate || undefined,
      purchased: false,
    });
    resetForm();
    setShowForm(false);
  };

  const pending = wishlist.filter((w) => !w.purchased).sort((a, b) => {
    const order: Record<WishlistPriority, number> = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });
  const purchased = wishlist.filter((w) => w.purchased);

  const monthsToAfford = (cost: number): number | null => {
    if (monthlySurplus <= 0) return null;
    return Math.ceil(cost / monthlySurplus);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 md:p-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">רשימת רצונות</h1>
          <p className="text-sm text-[#9090A8] mt-0.5">
            {monthlySurplus > 0
              ? `על בסיס עודף ממוצע של ${formatCurrency(Math.round(monthlySurplus))}/חודש`
              : 'הוסף הכנסות והוצאות כדי לחשב זמן חיסכון'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((o) => !o)}
          className="flex items-center gap-2 bg-lavender-dark text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] transition-colors cursor-pointer shadow-sm"
        >
          <PlusIcon />
          הוסף פריט
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-lavender p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1E1E2E]">פריט חדש ברשימת הרצונות</h2>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">סמל</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={`text-xl p-1 rounded-lg cursor-pointer transition-all ${form.emoji === e ? 'bg-lavender-light ring-2 ring-lavender-dark scale-110' : 'hover:bg-gray-100'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1">שם הפריט</label>
              <input
                type="text"
                placeholder="למשל: מחשב נייד"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputCls}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1">מחיר (₪)</label>
              <input
                type="number"
                placeholder="0"
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1">עדיפות</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as WishlistPriority }))}
                className={inputCls}
              >
                <option value="high">גבוהה</option>
                <option value="medium">בינונית</option>
                <option value="low">נמוכה</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B8A] mb-1">תאריך יעד (אופציונלי)</label>
              <input
                type="month"
                value={form.targetDate}
                onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1">הערות</label>
            <input
              type="text"
              placeholder="למשל: להשוות מחירים, מותג מועדף..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={inputCls}
            />
          </div>

          {/* Preview affordability */}
          {form.cost && parseFloat(form.cost) > 0 && (
            <div className="bg-lavender-light rounded-lg p-3 text-sm text-lavender-dark">
              זמן חיסכון משוער:{' '}
              <strong>
                {monthlySurplus > 0
                  ? `${Math.ceil(parseFloat(form.cost) / monthlySurplus)} חודשים`
                  : 'לא ניתן לחשב — הזן נתוני הכנסות'}
              </strong>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-sm text-[#9090A8] hover:text-[#1E1E2E] px-4 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              ביטול
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.cost || parseFloat(form.cost) <= 0}
              className="text-sm bg-lavender-dark text-white px-5 py-2 rounded-lg hover:bg-[#5B52A0] disabled:opacity-50 cursor-pointer font-medium"
            >
              הוסף
            </button>
          </div>
        </div>
      )}

      {/* Pending items */}
      {pending.length === 0 && !showForm && (
        <div className="text-center py-16 text-[#9090A8]">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-base font-medium text-[#4A4A60]">רשימת הרצונות ריקה</p>
          <p className="text-sm mt-1">הוסף פריטים שאתה רוצה לרכוש ותכנן מתי תוכל להרשות לעצמך</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((item) => {
            const months = monthsToAfford(item.cost);
            const priority = PRIORITY_LABELS[item.priority];
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#1E1E2E]">{item.name}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${priority.color}`}>
                        {priority.label}
                      </span>
                      <AffordabilityBadge months={months} monthlySurplus={monthlySurplus} />
                    </div>
                    <p className="text-base font-bold text-[#1E1E2E] mt-1">{formatCurrency(item.cost)}</p>
                    {item.notes && <p className="text-xs text-[#9090A8] mt-0.5">{item.notes}</p>}
                    {item.targetDate && (
                      <p className="text-xs text-[#9090A8] mt-0.5">
                        יעד: {item.targetDate.replace('-', '/')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { if (window.confirm('לסמן כנרכש?')) markWishlistPurchased(item.id); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-sage-light text-sage-dark hover:bg-sage hover:text-white transition-colors cursor-pointer"
                      title="סמן כנרכש"
                    >
                      <CheckIcon />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('למחוק פריט זה?')) deleteWishlistItem(item.id); }}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-[#9090A8] hover:bg-blush-light hover:text-red-500 transition-colors cursor-pointer"
                      title="מחק"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Purchased */}
      {purchased.length > 0 && (
        <div>
          <button
            onClick={() => setShowPurchased((o) => !o)}
            className="text-sm text-[#9090A8] hover:text-[#1E1E2E] flex items-center gap-1 cursor-pointer"
          >
            נרכש ({purchased.length}) {showPurchased ? '▲' : '▼'}
          </button>
          {showPurchased && (
            <div className="mt-2 space-y-2">
              {purchased.map((item) => (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 opacity-60">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E1E2E] line-through">{item.name}</p>
                    <p className="text-xs text-[#9090A8]">{formatCurrency(item.cost)} • נרכש {item.purchasedDate ?? ''}</p>
                  </div>
                  <button
                    onClick={() => deleteWishlistItem(item.id)}
                    className="text-[#9090A8] hover:text-red-500 cursor-pointer"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
