import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { Debt, DebtType } from '../../types';

const DEBT_TYPE_NAMES: Record<DebtType, string> = {
  credit_card: 'כרטיס אשראי',
  personal_loan: 'הלוואה אישית',
  car_loan: 'הלוואת רכב',
  overdraft: 'מינוס בבנק',
  other: 'אחר',
};

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

const emptyDebt = (): Omit<Debt, 'id'> => ({
  name: '',
  balance: 0,
  interestRate: 0,
  minimumPayment: 0,
  type: 'credit_card',
  notes: '',
});

function calcPayoffMonths(balance: number, rate: number, payment: number): number {
  if (payment <= 0 || balance <= 0) return Infinity;
  const monthlyRate = rate / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / payment);
  let bal = balance;
  let months = 0;
  while (bal > 0 && months < 600) { bal = bal * (1 + monthlyRate) - payment; months++; }
  return months;
}

function calcTotalInterest(balance: number, rate: number, payment: number): number {
  if (payment <= 0 || balance <= 0) return 0;
  const monthlyRate = rate / 100 / 12;
  let bal = balance;
  let totalPaid = 0;
  let months = 0;
  while (bal > 0 && months < 600) { bal = bal * (1 + monthlyRate) - payment; totalPaid += payment; months++; }
  return Math.max(0, totalPaid - balance);
}

interface DebtFormProps { f: Omit<Debt, 'id'>; setF: (v: Omit<Debt, 'id'>) => void; }

function DebtForm({ f, setF }: DebtFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם החוב</label>
        <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="למשל: ויזה, הלוואת בנק" className={INPUT_CLS} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סוג</label>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as DebtType })} className={`${INPUT_CLS} cursor-pointer`}>
          {Object.entries(DEBT_TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יתרת חוב (₪)</label>
        <input type="number" value={f.balance || ''} onChange={(e) => setF({ ...f, balance: Number(e.target.value) })} placeholder="0" className={INPUT_CLS} min={0} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">ריבית שנתית (%)</label>
        <input type="number" step="0.1" value={f.interestRate || ''} onChange={(e) => setF({ ...f, interestRate: Number(e.target.value) })} placeholder="0" className={INPUT_CLS} min={0} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תשלום מינימלי (₪)</label>
        <input type="number" value={f.minimumPayment || ''} onChange={(e) => setF({ ...f, minimumPayment: Number(e.target.value) })} placeholder="0" className={INPUT_CLS} min={0} />
      </div>
      <div>
        <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
        <input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="אופציונלי" className={INPUT_CLS} />
      </div>
    </div>
  );
}

export default function DebtPlannerPage() {
  const debts = useFinanceStore((s) => s.debts);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Debt, 'id'>>(emptyDebt());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<Debt, 'id'>>(emptyDebt());
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);

  const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
  const totalMinimum = debts.reduce((s, d) => s + d.minimumPayment, 0);

  const handleAdd = () => {
    if (!form.name || form.balance <= 0) return;
    addDebt(form);
    setForm(emptyDebt());
    setShowAdd(false);
  };

  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.interestRate - a.interestRate : a.balance - b.balance
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">תכנון פירעון חובות</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">שיטת שלג גדל, שיטת מפולת — מי שמשתלם יותר?</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-blush-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#7B5AA0] cursor-pointer shadow-sm">
          + הוסף חוב
        </button>
      </div>

      {totalBalance > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-red-400" />
            <div className="p-3">
              <p className="text-xs text-[#9090A8]">סה&quot;כ חובות</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-amber-400" />
            <div className="p-3">
              <p className="text-xs text-[#9090A8]">מינימום/חודש</p>
              <p className="text-xl font-bold text-[#1E1E2E]">{formatCurrency(totalMinimum)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-lavender-dark" />
            <div className="p-3">
              <p className="text-xs text-[#9090A8]">מספר חובות</p>
              <p className="text-xl font-bold text-[#1E1E2E]">{debts.length}</p>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">הוסף חוב</h3>
          <DebtForm f={form} setF={setForm} />
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowAdd(false); setForm(emptyDebt()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleAdd} className="bg-blush-dark text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer">הוסף</button>
          </div>
        </div>
      )}

      {debts.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-sm">אין חובות מוגדרים — לחץ על &quot;הוסף חוב&quot;</p>
        </div>
      ) : debts.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-semibold text-[#6B6B8A] mb-3">אסטרטגיית פירעון</p>
            <div className="flex gap-3 flex-wrap mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={strategy === 'avalanche'} onChange={() => setStrategy('avalanche')} className="accent-lavender-dark" />
                <div>
                  <p className="text-sm font-medium text-[#1E1E2E]">מפולת (Avalanche)</p>
                  <p className="text-xs text-[#9090A8]">ריבית גבוהה ראשון — חוסך יותר ריבית</p>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={strategy === 'snowball'} onChange={() => setStrategy('snowball')} className="accent-lavender-dark" />
                <div>
                  <p className="text-sm font-medium text-[#1E1E2E]">שלג גדל (Snowball)</p>
                  <p className="text-xs text-[#9090A8]">יתרה קטנה ראשון — מוטיבציה גבוהה יותר</p>
                </div>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-[#6B6B8A]">תשלום נוסף מעל מינימום:</label>
              <input type="number" value={extraPayment || ''} onChange={(e) => setExtraPayment(Number(e.target.value))} placeholder="0" className="border border-gray-200 rounded-lg px-3 py-1.5 w-28 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark" />
              <span className="text-xs text-[#9090A8]">₪/חודש</span>
            </div>
          </div>

          <div className="space-y-3">
            {sorted.map((debt, idx) => {
              const isFirst = idx === 0;
              const payment = debt.minimumPayment + (isFirst ? extraPayment : 0);
              const months = calcPayoffMonths(debt.balance, debt.interestRate, payment);
              const interest = calcTotalInterest(debt.balance, debt.interestRate, payment);
              const years = Math.floor(months / 12);
              const mo = months % 12;

              return (
                <div key={debt.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isFirst && extraPayment > 0 ? 'border-lavender-dark' : 'border-gray-100'}`}>
                  {isFirst && extraPayment > 0 && <div className="h-1 bg-lavender-dark" />}
                  {editingId === debt.id ? (
                    <div className="p-4">
                      <DebtForm f={editForm} setF={setEditForm} />
                      <div className="flex gap-2 mt-3 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-sm text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                        <button onClick={() => { updateDebt(debt.id, editForm); setEditingId(null); }} className="bg-sage-dark text-white px-4 py-1.5 rounded-lg text-sm cursor-pointer">שמור</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#1E1E2E]">{debt.name}</span>
                            <span className="text-xs text-[#9090A8] bg-gray-100 px-2 py-0.5 rounded-full">{DEBT_TYPE_NAMES[debt.type]}</span>
                            {isFirst && extraPayment > 0 && <span className="text-xs bg-lavender-light text-[#5B52A0] px-2 py-0.5 rounded-full font-medium">◎ מיקוד נוכחי</span>}
                          </div>
                          <p className="text-xs text-[#9090A8] mt-1">ריבית {debt.interestRate}% | מינימום {formatCurrency(debt.minimumPayment)}</p>
                        </div>
                        <p className="text-xl font-bold text-red-600 flex-shrink-0">{formatCurrency(debt.balance)}</p>
                      </div>
                      {months < 600 && (
                        <div className="bg-gray-50 rounded-lg p-3 text-xs text-[#6B6B8A] space-y-1">
                          <p>תאריך פירעון: <span className="font-semibold text-[#1E1E2E]">{years > 0 ? `${years} שנה ` : ''}{mo} חודשים</span></p>
                          <p>סה&quot;כ ריבית שתשלם: <span className="font-semibold text-red-500">{formatCurrency(interest)}</span></p>
                          {isFirst && extraPayment > 0 && <p className="text-[#5B52A0]">✓ תשלום: {formatCurrency(payment)}/חודש (כולל {formatCurrency(extraPayment)} נוסף)</p>}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                        <button onClick={() => { setEditingId(debt.id); setEditForm({ name: debt.name, balance: debt.balance, interestRate: debt.interestRate, minimumPayment: debt.minimumPayment, type: debt.type, notes: debt.notes }); }} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">עריכה</button>
                        <button onClick={() => { if (window.confirm('למחוק חוב זה?')) deleteDebt(debt.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 cursor-pointer">מחיקה</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
