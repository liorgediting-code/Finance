import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';
import { HEBREW_MONTHS } from '../../config/months';
import type { Installment } from '../../types';

function getMonthlyPayment(inst: Installment): number {
  return inst.numPayments > 0 ? inst.totalAmount / inst.numPayments : 0;
}

function getRemainingPayments(inst: Installment): number {
  return inst.numPayments - inst.paidPayments;
}

function getRemainingAmount(inst: Installment): number {
  return getRemainingPayments(inst) * getMonthlyPayment(inst);
}

function isActiveInMonth(inst: Installment, monthIndex: number, year: number): boolean {
  const startMonth = inst.startYear * 12 + inst.startMonth;
  const endMonth = startMonth + inst.numPayments - 1;
  const currentMonth = year * 12 + monthIndex;
  return currentMonth >= startMonth && currentMonth <= endMonth;
}

const emptyForm = (): Omit<Installment, 'id'> => ({
  description: '',
  totalAmount: 0,
  numPayments: 3,
  paidPayments: 0,
  startMonth: new Date().getMonth(),
  startYear: new Date().getFullYear(),
  categoryId: 'home',
  notes: '',
});

const TRACK_TYPE_NAMES: Record<string, string> = {
  prime: 'פריים',
  fixed: 'קבועה',
  cpi: 'צמוד מדד',
  variable: 'משתנה',
};
Object.assign(TRACK_TYPE_NAMES, {});

export default function InstallmentsPage() {
  const installments = useFinanceStore((s) => s.installments);
  const addInstallment = useFinanceStore((s) => s.addInstallment);
  const updateInstallment = useFinanceStore((s) => s.updateInstallment);
  const deleteInstallment = useFinanceStore((s) => s.deleteInstallment);
  const payInstallmentMonth = useFinanceStore((s) => s.payInstallmentMonth);
  const year = useFinanceStore((s) => s.settings.year);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Installment, 'id'>>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Installment, 'id'>>(emptyForm());

  const today = new Date();
  const currentMonthIndex = today.getMonth();

  const totalMonthlyCommitment = installments
    .filter((i) => isActiveInMonth(i, currentMonthIndex, year) && getRemainingPayments(i) > 0)
    .reduce((s, i) => s + getMonthlyPayment(i), 0);

  const totalRemainingDebt = installments.reduce((s, i) => s + getRemainingAmount(i), 0);

  const handleAdd = () => {
    if (!form.description || form.totalAmount <= 0 || form.numPayments <= 0) return;
    addInstallment(form);
    setForm(emptyForm());
    setShowAdd(false);
  };

  const startEdit = (inst: Installment) => {
    setEditingId(inst.id);
    setEditForm({ description: inst.description, totalAmount: inst.totalAmount, numPayments: inst.numPayments, paidPayments: inst.paidPayments, startMonth: inst.startMonth, startYear: inst.startYear, categoryId: inst.categoryId, notes: inst.notes });
  };

  const saveEdit = (id: string) => {
    updateInstallment(id, editForm);
    setEditingId(null);
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">תשלומים</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">מעקב אחר רכישות בתשלומים</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] transition-colors cursor-pointer shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          הוסף רכישה בתשלומים
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-lavender-dark" />
          <div className="p-4">
            <p className="text-xs text-[#9090A8] mb-1">התחייבות חודשית נוכחית</p>
            <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalMonthlyCommitment)}</p>
            <p className="text-xs text-[#9090A8] mt-1">ב{HEBREW_MONTHS[currentMonthIndex]}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-blush-dark" />
          <div className="p-4">
            <p className="text-xs text-[#9090A8] mb-1">סה&quot;כ יתרת חוב תשלומים</p>
            <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalRemainingDebt)}</p>
            <p className="text-xs text-[#9090A8] mt-1">{installments.filter((i) => getRemainingPayments(i) > 0).length} רכישות פעילות</p>
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3">רכישה חדשה בתשלומים</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תיאור הרכישה</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="למשל: מכשיר חשמלי, אופניים" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">קטגוריה</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={`${inputCls} cursor-pointer`}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.nameHe}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סכום כולל (₪)</label>
              <input type="number" value={form.totalAmount || ''} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} placeholder="0" min={0} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">מספר תשלומים</label>
              <input type="number" value={form.numPayments} onChange={(e) => setForm({ ...form, numPayments: Number(e.target.value) })} min={1} max={120} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תשלומים שכבר שולמו</label>
              <input type="number" value={form.paidPayments} onChange={(e) => setForm({ ...form, paidPayments: Number(e.target.value) })} min={0} max={form.numPayments} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">חודש התחלה</label>
              <select value={form.startMonth} onChange={(e) => setForm({ ...form, startMonth: Number(e.target.value) })} className={`${inputCls} cursor-pointer`}>
                {HEBREW_MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שנת התחלה</label>
              <input type="number" value={form.startYear} onChange={(e) => setForm({ ...form, startYear: Number(e.target.value) })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="אופציונלי" className={inputCls} />
            </div>
          </div>
          {form.totalAmount > 0 && form.numPayments > 0 && (
            <p className="text-xs text-[#6B6B8A] mt-3 bg-lavender-light/50 rounded-lg px-3 py-2">
              תשלום חודשי: <span className="font-semibold text-[#1E1E2E]">{formatCurrency(form.totalAmount / form.numPayments)}</span>
              {' '} | נותרו: <span className="font-semibold">{form.numPayments - form.paidPayments} תשלומים</span>
              {' '} = <span className="font-semibold">{formatCurrency((form.numPayments - form.paidPayments) * (form.totalAmount / form.numPayments))}</span>
            </p>
          )}
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowAdd(false); setForm(emptyForm()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleAdd} className="bg-lavender-dark text-white px-5 py-1.5 rounded-lg text-sm font-medium hover:bg-[#5B52A0] cursor-pointer">הוסף</button>
          </div>
        </div>
      )}

      {/* List */}
      {installments.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-sm">אין רכישות בתשלומים — לחץ על &quot;הוסף&quot; כדי להתחיל</p>
        </div>
      ) : (
        <div className="space-y-3">
          {installments.map((inst) => {
            const monthly = getMonthlyPayment(inst);
            const remaining = getRemainingPayments(inst);
            const remainingAmt = getRemainingAmount(inst);
            const pct = Math.round((inst.paidPayments / inst.numPayments) * 100);
            const isDone = remaining === 0;
            const catColor = CATEGORIES.find((c) => c.id === inst.categoryId)?.color ?? '#9090A8';
            const catName = CATEGORIES.find((c) => c.id === inst.categoryId)?.nameHe ?? '';

            return (
              <div key={inst.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isDone ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                <div className="h-1" style={{ backgroundColor: catColor }} />
                {editingId === inst.id ? (
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                      <div className="col-span-2 sm:col-span-3">
                        <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={inputCls} placeholder="תיאור" />
                      </div>
                      <div><input type="number" value={editForm.totalAmount || ''} onChange={(e) => setEditForm({ ...editForm, totalAmount: Number(e.target.value) })} className={inputCls} placeholder="סכום כולל" /></div>
                      <div><input type="number" value={editForm.numPayments} onChange={(e) => setEditForm({ ...editForm, numPayments: Number(e.target.value) })} className={inputCls} placeholder="מס׳ תשלומים" /></div>
                      <div><input type="number" value={editForm.paidPayments} onChange={(e) => setEditForm({ ...editForm, paidPayments: Number(e.target.value) })} className={inputCls} placeholder="שולמו" /></div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-sm text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                      <button onClick={() => saveEdit(inst.id)} className="bg-sage-dark text-white px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer">שמור</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-[#1E1E2E]">{inst.description}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-[#9090A8] bg-gray-100 px-2 py-0.5 rounded-full" style={{ color: catColor }}>{catName}</span>
                          <span className="text-xs text-[#9090A8]">
                            {HEBREW_MONTHS[inst.startMonth]} {inst.startYear}
                          </span>
                          {isDone && (
                            <span className="text-xs bg-sage-light text-sage-dark px-2 py-0.5 rounded-full font-medium">הסתיים</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[#1E1E2E]">{formatCurrency(monthly)}<span className="text-xs font-normal text-[#9090A8]">/חודש</span></p>
                        <p className="text-xs text-[#9090A8] mt-0.5">{formatCurrency(inst.totalAmount)} סה&quot;כ</p>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-[#9090A8] mb-1">
                        <span>{inst.paidPayments} מתוך {inst.numPayments} תשלומים</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full bg-lavender-dark transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {!isDone && (
                      <p className="text-xs text-[#6B6B8A]">
                        נותרו <span className="font-semibold">{remaining} תשלומים</span> = <span className="font-semibold">{formatCurrency(remainingAmt)}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {!isDone && (
                        <button
                          onClick={() => payInstallmentMonth(inst.id)}
                          className="text-xs bg-sage-light text-sage-dark px-3 py-1.5 rounded-lg hover:bg-sage hover:text-white cursor-pointer font-medium transition-colors"
                        >
                          ✓ סמן תשלום שולם
                        </button>
                      )}
                      <button onClick={() => startEdit(inst)} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">עריכה</button>
                      <button
                        onClick={() => { if (window.confirm('למחוק רכישה זו?')) deleteInstallment(inst.id); }}
                        className="text-xs text-blush-dark hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                      >
                        מחיקה
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
