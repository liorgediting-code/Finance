import { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES, PAYMENT_METHODS } from '../../config/categories';
import { useShallow } from 'zustand/react/shallow';
import type { ExpenseEntry } from '../../types';

interface Props {
  onClose: () => void;
}

const today = () => new Date().toISOString().split('T')[0];

export default function QuickAddModal({ onClose }: Props) {
  const addExpense = useFinanceStore((s) => s.addExpense);
  const customCategories = useFinanceStore(useShallow((s) => s.settings.customCategories ?? []));
  const familyMembers = useFinanceStore(useShallow((s) => s.familyMembers));
  const { months } = useActiveBoardData();

  const currentMonth = new Date().getMonth();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ExpenseEntry['paymentMethod']>('credit');
  const [memberId, setMemberId] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (resetTimerRef.current) clearTimeout(resetTimerRef.current); };
  }, []);

  const selectedCat = CATEGORIES.find((c) => c.id === categoryId);
  const subcategoryId = selectedCat?.subcategories[0]?.id ?? '';

  // Count existing expenses this month so user sees context
  const monthExpenseCount = (months[currentMonth]?.expenses ?? []).length;

  const handleSubmit = () => {
    setError('');
    if (!categoryId) { setError('נא לבחור קטגוריה'); return; }
    if (!amount || Number(amount) <= 0) { setError('נא להזין סכום תקין'); return; }

    addExpense(currentMonth, {
      date: today(),
      categoryId,
      subcategoryId,
      customCategory: '',
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      notes: '',
      cancelUrl: '',
      isPending: false,
      memberId: memberId || undefined,
    });

    setSaved(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => {
      setSaved(false);
      setAmount('');
      setDescription('');
    }, 1200);
  };

  const handleKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  const monthName = new Date(2000, currentMonth).toLocaleString('he-IL', { month: 'long' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-[#1E1E2E]">הוספה מהירה</h2>
            <p className="text-[10px] text-[#9090A8] mt-0.5">{monthName} — {monthExpenseCount} הוצאות כבר רשומות</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#9090A8] hover:text-[#1E1E2E] hover:bg-gray-100 transition-colors cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Success flash */}
          {saved && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm font-medium">
              <span className="text-xl">✓</span>
              הוצאה נוספה בהצלחה!
            </div>
          )}

          {error && (
            <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Amount — largest field, first focus */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B8A] mb-1.5 block">סכום (₪)</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#9090A8]">₪</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl pr-8 pl-3 py-3 text-xl font-bold text-[#1E1E2E] focus:outline-none focus:border-lavender-dark transition-colors"
                autoFocus
                min={0}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B8A] mb-1.5 block">קטגוריה</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors cursor-pointer bg-white"
            >
              <option value="">-- בחר קטגוריה --</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.nameHe}</option>
              ))}
              {customCategories.length > 0 && (
                <optgroup label="קטגוריות מותאמות">
                  {customCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameHe}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B8A] mb-1.5 block">תיאור (אופציונלי)</label>
            <input
              type="text"
              placeholder="מה קנית?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors"
            />
          </div>

          {/* Payment method chips */}
          <div>
            <label className="text-xs font-semibold text-[#6B6B8A] mb-1.5 block">אמצעי תשלום</label>
            <div className="flex gap-2 flex-wrap">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as ExpenseEntry['paymentMethod'])}
                  className="flex-1 text-xs py-2 rounded-lg border-2 transition-all cursor-pointer font-medium min-w-[60px]"
                  style={
                    paymentMethod === pm.id
                      ? { backgroundColor: '#5B52A0', color: 'white', borderColor: '#5B52A0' }
                      : { borderColor: '#E5E7EB', color: '#6B7280', backgroundColor: 'white' }
                  }
                >
                  {pm.nameHe}
                </button>
              ))}
            </div>
          </div>

          {/* Family member (only if members exist) */}
          {familyMembers.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-[#6B6B8A] mb-1.5 block">שיוך לבן משפחה</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors cursor-pointer bg-white"
              >
                <option value="">ללא שיוך</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-[#6B6B8A] hover:bg-gray-50 transition-colors cursor-pointer"
          >
            סגור
          </button>
          <button
            onClick={handleSubmit}
            className="flex-2 flex-grow py-3 rounded-xl bg-blush-dark text-white text-sm font-bold hover:bg-[#7B5AA0] transition-colors cursor-pointer shadow-sm"
          >
            + הוסף הוצאה
          </button>
        </div>
      </div>
    </div>
  );
}
