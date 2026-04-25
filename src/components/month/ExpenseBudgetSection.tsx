import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES, PAYMENT_METHODS } from '../../config/categories';
import type { ExpenseEntry } from '../../types';

interface Props {
  monthIndex: number;
}

const today = () => new Date().toISOString().split('T')[0];

const emptyForm = (): Omit<ExpenseEntry, 'id'> => ({
  date: today(),
  categoryId: '',
  subcategoryId: '',
  customCategory: '',
  description: '',
  amount: 0,
  paymentMethod: 'credit',
  notes: '',
  cancelUrl: '',
});

function getSubName(entry: ExpenseEntry): string {
  if (entry.categoryId === 'other' && entry.customCategory?.trim()) return entry.customCategory.trim();
  const cat = CATEGORIES.find((c) => c.id === entry.categoryId);
  return cat?.subcategories.find((s) => s.id === entry.subcategoryId)?.nameHe ?? entry.subcategoryId;
}

function getPaymentName(method: string): string {
  return PAYMENT_METHODS.find((m) => m.id === method)?.nameHe ?? method;
}

function PlusIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ChevronDownIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-3.5 w-3.5 text-[#9090A8] transition-transform duration-200 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

interface AddFormProps {
  initialCategoryId?: string;
  monthIndex: number;
  onClose: () => void;
}

function AddExpenseForm({ initialCategoryId, monthIndex, onClose }: AddFormProps) {
  const addExpense = useFinanceStore((s) => s.addExpense);
  const addRecurringExpense = useFinanceStore((s) => s.addRecurringExpense);

  const [form, setForm] = useState<Omit<ExpenseEntry, 'id'>>({
    ...emptyForm(),
    categoryId: initialCategoryId ?? '',
    subcategoryId: initialCategoryId
      ? (CATEGORIES.find((c) => c.id === initialCategoryId)?.subcategories[0]?.id ?? '')
      : '',
  });
  const [isRecurring, setIsRecurring] = useState(initialCategoryId === 'subscriptions');
  const [errors, setErrors] = useState<string[]>([]);

  const selectedCat = CATEGORIES.find((c) => c.id === form.categoryId);
  const subcategories = selectedCat?.subcategories ?? [];
  const isOther = form.categoryId === 'other';
  const isSubscription = form.categoryId === 'subscriptions';

  const handleCatChange = (catId: string) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    setForm({ ...form, categoryId: catId, subcategoryId: cat?.subcategories[0]?.id ?? '', customCategory: '' });
    if (catId === 'subscriptions') setIsRecurring(true);
  };

  const handleSubmit = () => {
    const submitForm = { ...form, date: form.date || today() };
    const errs: string[] = [];
    if (!submitForm.categoryId) errs.push('קטגוריה');
    if (isOther && !submitForm.customCategory?.trim()) errs.push('שם הקטגוריה');
    if (submitForm.amount <= 0) errs.push('סכום');
    if (errs.length > 0) { setErrors(errs); return; }

    if (isRecurring) {
      addRecurringExpense(submitForm);
    } else {
      addExpense(monthIndex, submitForm);
    }
    onClose();
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
      {errors.length > 0 && (
        <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          נא למלא: {errors.join(', ')}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תאריך</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">קטגוריה</label>
          <select value={form.categoryId} onChange={(e) => handleCatChange(e.target.value)} className={`${inputCls} cursor-pointer`}>
            <option value="">-- בחר --</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.nameHe}</option>
            ))}
          </select>
        </div>

        {isOther ? (
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם הקטגוריה</label>
            <input type="text" placeholder="למשל: מתנה לחבר" value={form.customCategory ?? ''} onChange={(e) => setForm({ ...form, customCategory: e.target.value })} className={inputCls} />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תת-קטגוריה</label>
            <select value={form.subcategoryId} onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })} className={`${inputCls} cursor-pointer`} disabled={!form.categoryId}>
              <option value="">-- בחר --</option>
              {subcategories.map((s) => <option key={s.id} value={s.id}>{s.nameHe}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תיאור</label>
          <input type="text" placeholder="תיאור קצר" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
        </div>

        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סכום (₪)</label>
          <input type="number" placeholder="0" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className={inputCls} min={0} />
        </div>

        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">אמצעי תשלום</label>
          <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as ExpenseEntry['paymentMethod'] })} className={`${inputCls} cursor-pointer`}>
            {PAYMENT_METHODS.map((pm) => <option key={pm.id} value={pm.id}>{pm.nameHe}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
          <input type="text" placeholder="אופציונלי" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
        </div>

        {isSubscription && (
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">קישור לביטול (אופציונלי)</label>
            <input
              type="url"
              placeholder="https://..."
              value={form.cancelUrl ?? ''}
              onChange={(e) => setForm({ ...form, cancelUrl: e.target.value })}
              className={inputCls}
              dir="ltr"
            />
          </div>
        )}
      </div>

      {/* Recurring toggle */}
      <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit" onClick={() => setIsRecurring((v) => !v)}>
        <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isRecurring ? 'bg-blush-dark' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
        <span className="text-sm text-[#4A4A60] flex items-center gap-1.5">
          <RepeatIcon />
          הוצאה קבועה (תופיע בכל חודש)
        </span>
      </label>

      <div className="flex gap-2 mt-4 justify-end">
        <button onClick={onClose} className="text-sm text-[#6B6B8A] hover:text-[#1E1E2E] px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          ביטול
        </button>
        <button onClick={handleSubmit} className="flex items-center gap-1.5 bg-blush-dark text-white rounded-lg px-5 py-1.5 text-sm font-medium hover:bg-[#7B5AA0] transition-colors cursor-pointer shadow-sm">
          שמור הוצאה
        </button>
      </div>
    </div>
  );
}

export default function ExpenseBudgetSection({ monthIndex }: Props) {
  const { months, recurringExpenses } = useActiveBoardData();
  const monthData = months[monthIndex];
  const deleteRecurringExpense = useFinanceStore((s) => s.deleteRecurringExpense);
  const updateExpense = useFinanceStore((s) => s.updateExpense);
  const deleteExpense = useFinanceStore((s) => s.deleteExpense);

  const setBudget = useFinanceStore((s) => s.setBudget);

  const budget = monthData?.budget ?? {};
  const monthExpenses = monthData?.expenses ?? [];
  const expenses = [...recurringExpenses, ...monthExpenses];

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormCatId, setAddFormCatId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<ExpenseEntry, 'id'>>(emptyForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  const toggleCat = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const openAddForm = (catId?: string) => {
    setAddFormCatId(catId);
    setShowAddForm(true);
    if (catId) setExpandedCats((prev) => new Set([...prev, catId]));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setEditForm({ date: entry.date, categoryId: entry.categoryId, subcategoryId: entry.subcategoryId, customCategory: entry.customCategory ?? '', description: entry.description, amount: entry.amount, paymentMethod: entry.paymentMethod, notes: entry.notes, cancelUrl: entry.cancelUrl ?? '' });
  };

  const saveEdit = (id: string) => {
    updateExpense(monthIndex, id, editForm);
    setEditingId(null);
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white';

  const q = searchQuery.trim().toLowerCase();
  const filteredExpenses = q
    ? expenses.filter((e) => {
        const catName = CATEGORIES.find((c) => c.id === e.categoryId)?.nameHe ?? '';
        const subName = getSubName(e);
        return (
          e.description.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          subName.toLowerCase().includes(q) ||
          String(e.amount).includes(q)
        );
      })
    : expenses;

  let totalActual = 0;

  const rows = CATEGORIES.map((cat) => {
    const catExpenses = filteredExpenses.filter((e) => e.categoryId === cat.id);
    const actual = catExpenses.reduce((s, e) => s + e.amount, 0);
    const budgetAmt = budget[cat.id] ?? 0;
    const overBudget = budgetAmt > 0 && actual > budgetAmt;
    totalActual += actual;
    return { cat, catExpenses, actual, budgetAmt, overBudget };
  });

  const visibleRows = rows.filter((r) => r.actual > 0);
  const overBudgetCount = rows.filter((r) => r.overBudget).length;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-[#1E1E2E]">הוצאות</h3>
          <button
            onClick={() => setShowBudgetSettings((v) => !v)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors cursor-pointer ${showBudgetSettings ? 'bg-lavender text-[#5B52A0]' : 'text-[#9090A8] hover:bg-gray-100'}`}
            title="הגדרת תקציב לקטגוריות"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            תקציב
          </button>
        </div>
        <button
          onClick={() => openAddForm(undefined)}
          className="flex items-center gap-1.5 bg-blush-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7B5AA0] transition-colors cursor-pointer shadow-sm"
        >
          <PlusIcon />
          הוסף הוצאה
        </button>
      </div>

      {/* Budget alerts */}
      {overBudgetCount > 0 && !showBudgetSettings && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-xs text-red-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>חריגה מהתקציב ב-{overBudgetCount} קטגוריות</span>
        </div>
      )}

      {/* Budget settings panel */}
      {showBudgetSettings && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-medium text-[#6B6B8A] mb-3">הגדר תקציב חודשי לכל קטגוריה (₪)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CATEGORIES.filter((c) => c.id !== 'other').map((cat) => {
              const bAmt = budget[cat.id] ?? 0;
              const catActual = expenses.filter((e) => e.categoryId === cat.id).reduce((s, e) => s + e.amount, 0);
              const isOver = bAmt > 0 && catActual > bAmt;
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <label className="text-xs text-[#4A4A60] flex-1 truncate">{cat.nameHe}</label>
                  <input
                    type="number"
                    value={bAmt || ''}
                    onChange={(e) => setBudget(monthIndex, cat.id, Number(e.target.value))}
                    className={`border rounded-md px-2 py-1 w-20 text-xs text-right focus:outline-none focus:ring-1 focus:ring-lavender-dark ${isOver ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                    placeholder="0"
                    min={0}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-3">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9090A8] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="חיפוש הוצאה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9090A8] hover:text-[#4A4A60] cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddExpenseForm
          initialCategoryId={addFormCatId}
          monthIndex={monthIndex}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Main table */}
      <div className="rounded-xl shadow-sm overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_40px] bg-lavender-light text-[#4A4A60] text-xs font-semibold px-4 py-2.5">
          <span>קטגוריה</span>
          <span className="text-right">סכום</span>
          <span />
        </div>

        {visibleRows.length === 0 && (
          <div className="text-center text-[#9090A8] py-12 bg-white text-sm">
            אין הוצאות עדיין — לחץ על &quot;הוסף הוצאה&quot; כדי להתחיל
          </div>
        )}

        {visibleRows.map(({ cat, catExpenses, actual, budgetAmt, overBudget }, rowIdx) => {
          const isExpanded = expandedCats.has(cat.id);

          return (
            <div key={cat.id}>
              {/* Category row */}
              <div
                className={`grid grid-cols-[1fr_100px_40px] items-center px-4 py-2.5 border-b border-gray-100 transition-colors ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-lavender-light/20`}
              >
                <button
                  className="flex items-center gap-2 text-right font-medium text-[#1E1E2E] hover:text-[#5B52A0] transition-colors cursor-pointer"
                  onClick={() => toggleCat(cat.id)}
                >
                  <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm">{cat.nameHe}</span>
                  {catExpenses.length > 0 && (
                    <span className="text-xs text-[#9090A8] bg-gray-100 px-1.5 py-0.5 rounded-full font-normal">
                      {catExpenses.length}
                    </span>
                  )}
                  {catExpenses.some((e) => e.isRecurring) && (
                    <span className="inline-flex items-center gap-0.5 text-[#7B5AA0] text-[10px]">
                      <RepeatIcon />
                    </span>
                  )}
                  <span className="mr-auto">
                    <ChevronDownIcon expanded={isExpanded} />
                  </span>
                </button>

                <div className="text-right text-sm font-medium">
                  <span className={overBudget ? 'text-red-600' : 'text-[#1E1E2E]'}>{formatCurrency(actual)}</span>
                  {overBudget && (
                    <span className="text-[10px] text-red-500 block" title={`תקציב: ${formatCurrency(budgetAmt)}`}>
                      חריגה {formatCurrency(actual - budgetAmt)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openAddForm(cat.id)}
                  title="הוסף הוצאה לקטגוריה זו"
                  className="flex items-center justify-center w-7 h-7 rounded-full text-[#9090A8] hover:text-blush-dark hover:bg-blush-light transition-colors cursor-pointer"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Expanded: individual transactions */}
              {isExpanded && (
                <div className="bg-gray-50/80 border-b border-gray-100">
                  {catExpenses.length === 0 ? (
                    <p className="text-xs text-[#9090A8] px-10 py-3">אין הוצאות בקטגוריה זו</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[#9090A8] border-b border-gray-200">
                            <th className="px-10 py-2 text-right font-medium">תאריך</th>
                            <th className="px-3 py-2 text-right font-medium">תת-קטגוריה</th>
                            <th className="px-3 py-2 text-right font-medium">תיאור</th>
                            <th className="px-3 py-2 text-right font-medium">סכום</th>
                            <th className="px-3 py-2 text-right font-medium">תשלום</th>
                            <th className="px-3 py-2 text-center font-medium w-24">פעולות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catExpenses.map((entry) => (
                            editingId === entry.id && !entry.isRecurring ? (
                              <tr key={entry.id} className="bg-white border-b border-gray-200">
                                <td className="px-10 py-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputCls} /></td>
                                <td className="px-3 py-2">
                                  <select value={editForm.subcategoryId} onChange={(e) => setEditForm({ ...editForm, subcategoryId: e.target.value })} className={`${inputCls} cursor-pointer`}>
                                    {CATEGORIES.find((c) => c.id === cat.id)?.subcategories.map((s) => <option key={s.id} value={s.id}>{s.nameHe}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-2"><input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} /></td>
                                <td className="px-3 py-2"><input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className={inputCls} min={0} /></td>
                                <td className="px-3 py-2">
                                  <select value={editForm.paymentMethod} onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value as ExpenseEntry['paymentMethod'] })} className={`${inputCls} cursor-pointer`}>
                                    {PAYMENT_METHODS.map((pm) => <option key={pm.id} value={pm.id}>{pm.nameHe}</option>)}
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => saveEdit(entry.id)} className="text-white bg-sage-dark hover:bg-[#8AAA7A] px-2 py-0.5 rounded-md transition-colors cursor-pointer font-medium">שמור</button>
                                    <button onClick={() => setEditingId(null)} className="text-[#6B6B8A] hover:text-[#1E1E2E] px-2 py-0.5 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">ביטול</button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={entry.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                                <td className="px-10 py-2 text-[#6B6B8A]">{entry.date}</td>
                                <td className="px-3 py-2 text-[#6B6B8A]">{getSubName(entry)}</td>
                                <td className="px-3 py-2 text-[#1E1E2E]">
                                  <div className="flex items-center gap-1.5">
                                    {entry.description || <span className="text-gray-300">—</span>}
                                    {entry.isRecurring && (
                                      <span className="inline-flex items-center gap-0.5 bg-blush-light text-[#7B5AA0] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                        <RepeatIcon />
                                        קבוע
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 font-semibold text-[#1E1E2E]">{formatCurrency(entry.amount)}</td>
                                <td className="px-3 py-2 text-[#9090A8]">{getPaymentName(entry.paymentMethod)}</td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    {!entry.isRecurring && (
                                      <button
                                        onClick={() => startEdit(entry)}
                                        className="flex items-center gap-0.5 text-lavender-dark hover:text-[#5B52A0] hover:bg-lavender-light px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                                      >
                                        <EditIcon />
                                        עריכה
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const msg = entry.isRecurring
                                          ? `למחוק את "${entry.description || getSubName(entry)}" מכל החודשים?`
                                          : 'למחוק הוצאה זו?';
                                        if (window.confirm(msg)) {
                                          entry.isRecurring
                                            ? deleteRecurringExpense(entry.id)
                                            : deleteExpense(monthIndex, entry.id);
                                        }
                                      }}
                                      className="flex items-center gap-0.5 text-blush-dark hover:text-red-600 hover:bg-blush-light px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                                    >
                                      <TrashIcon />
                                      {entry.isRecurring ? 'בטל קבוע' : 'מחיקה'}
                                    </button>
                                    {entry.cancelUrl && (
                                      <a
                                        href={entry.cancelUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-0.5 text-xs text-[#9090A8] hover:text-red-500 hover:bg-red-50 px-1.5 py-0.5 rounded-md transition-colors"
                                        title="עבור לאתר לביטול המנוי"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                          <polyline points="15 3 21 3 21 9" />
                                          <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                        בטל מנוי
                                      </a>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Totals footer */}
        <div className="grid grid-cols-[1fr_100px_40px] bg-lavender-light/50 font-bold text-sm px-4 py-3 border-t border-gray-200">
          <span className="text-[#1E1E2E]">סה&quot;כ</span>
          <span className="text-right text-[#1E1E2E]">{formatCurrency(totalActual)}</span>
          <span />
        </div>
      </div>
    </section>
  );
}
