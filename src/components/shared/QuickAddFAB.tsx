import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CATEGORIES } from '../../config/categories';

export default function QuickAddFAB() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'cash' | 'transfer'>('credit');
  const [success, setSuccess] = useState(false);

  const addExpense = useFinanceStore((s) => s.addExpense);
  const hiddenSections = useFinanceStore((s) => s.settings.hiddenDashboardSections ?? []);

  if (hiddenSections.includes('quick-add')) return null;

  const currentMonth = new Date().getMonth();

  const reset = () => {
    setAmount('');
    setDesc('');
    setCategoryId('food');
    setPaymentMethod('credit');
    setSuccess(false);
  };

  const handleSubmit = () => {
    const amtNum = parseFloat(amount);
    if (!amtNum || amtNum <= 0) return;

    const cat = CATEGORIES.find((c) => c.id === categoryId);
    addExpense(currentMonth, {
      date: new Date().toISOString().split('T')[0],
      categoryId,
      subcategoryId: cat?.subcategories[0]?.id ?? '',
      description: desc.trim() || cat?.nameHe || categoryId,
      amount: amtNum,
      paymentMethod,
      notes: '',
    });

    setSuccess(true);
    setTimeout(() => {
      setOpen(false);
      reset();
    }, 900);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') { setOpen(false); reset(); }
  };

  const PAYMENT_LABELS: Record<string, string> = {
    credit: 'אשראי',
    cash: 'מזומן',
    transfer: 'העברה',
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-30 w-14 h-14 rounded-full bg-[#7B6DC8] text-white shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:bg-[#6B5DC0] active:scale-95"
        title="הוסף הוצאה מהירה"
        aria-label="הוסף הוצאה מהירה"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => { setOpen(false); reset(); }}
        />
      )}

      {/* Drawer / Modal */}
      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center"
          dir="rtl"
        >
          <div
            className="bg-white rounded-t-2xl md:rounded-2xl p-6 w-full md:max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full bg-[#EEF7EE] flex items-center justify-center text-2xl">✓</div>
                <p className="text-sm font-semibold text-[#3A7A3A]">ההוצאה נוספה בהצלחה!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-[#1E1E2E]">הוסף הוצאה מהירה</h3>
                  <button
                    onClick={() => { setOpen(false); reset(); }}
                    className="text-[#9090A8] hover:text-[#1E1E2E] text-lg leading-none cursor-pointer p-1"
                    aria-label="סגור"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B8A] mb-1">סכום (₪)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-lg font-bold text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-[#7B6DC8] placeholder:text-gray-300"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B8A] mb-1">תיאור</label>
                    <input
                      type="text"
                      placeholder="תיאור הרכישה"
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-[#7B6DC8] placeholder:text-[#9090A8]"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B8A] mb-1">קטגוריה</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-[#7B6DC8] bg-white cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nameHe}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B8A] mb-1">אמצעי תשלום</label>
                    <div className="flex gap-2">
                      {(['credit', 'cash', 'transfer'] as const).map((pm) => (
                        <button
                          key={pm}
                          onClick={() => setPaymentMethod(pm)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                            paymentMethod === pm
                              ? 'bg-[#7B6DC8] text-white'
                              : 'bg-gray-100 text-[#6B6B8A] hover:bg-gray-200'
                          }`}
                        >
                          {PAYMENT_LABELS[pm]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full bg-[#7B6DC8] text-white rounded-xl py-3 text-sm font-semibold cursor-pointer hover:bg-[#6B5DC0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors mt-1"
                  >
                    הוסף הוצאה
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
