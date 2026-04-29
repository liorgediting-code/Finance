import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { sumAmounts } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import type { IncomeEntry } from '../../types';

interface IncomeTableProps {
  monthIndex: number;
}

const today = () => new Date().toISOString().split('T')[0];

interface FormData {
  date: string;
  source: string;
  memberId: string;
  amount: number;
  notes: string;
  isRecurring: boolean;
}

const emptyForm = (defaultMemberId: string): FormData => ({
  date: today(),
  source: '',
  memberId: defaultMemberId,
  amount: 0,
  notes: '',
  isRecurring: false,
});

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

export default function IncomeTable({ monthIndex }: IncomeTableProps) {
  const { months, recurringIncomes } = useActiveBoardData();
  const monthData = months[monthIndex];
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const addIncome = useFinanceStore((s) => s.addIncome);
  const updateIncome = useFinanceStore((s) => s.updateIncome);
  const deleteIncome = useFinanceStore((s) => s.deleteIncome);
  const clearIncome = useFinanceStore((s) => s.clearIncome);
  const addRecurringIncome = useFinanceStore((s) => s.addRecurringIncome);
  const updateRecurringIncome = useFinanceStore((s) => s.updateRecurringIncome);
  const deleteRecurringIncome = useFinanceStore((s) => s.deleteRecurringIncome);

  const defaultMemberId = familyMembers[0]?.id ?? '';
  const monthlyEntries = monthData?.income ?? [];
  const allEntries = [...recurringIncomes, ...monthlyEntries];
  const totalIncome = sumAmounts(allEntries);

  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState<FormData>(() => emptyForm(defaultMemberId));
  const [errors, setErrors] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<IncomeEntry, 'id'>>({
    date: today(), source: '', memberId: defaultMemberId, amount: 0, notes: '',
  });

  const getMemberName = (id: string) =>
    familyMembers.find((m) => m.id === id)?.name ?? id;

  const handleAdd = () => {
    const errs: string[] = [];
    if (!newEntry.source.trim()) errs.push('מקור הכנסה');
    if (newEntry.amount <= 0) errs.push('סכום');
    if (errs.length > 0) { setErrors(errs); return; }

    const entry = { ...newEntry, date: newEntry.date || today() };
    if (newEntry.isRecurring) {
      addRecurringIncome(entry);
    } else {
      addIncome(monthIndex, entry);
    }
    setNewEntry(emptyForm(defaultMemberId));
    setErrors([]);
    setShowForm(false);
  };

  const startEdit = (entry: IncomeEntry) => {
    setEditingId(entry.id);
    setEditForm({ date: entry.date, source: entry.source, memberId: entry.memberId, amount: entry.amount, notes: entry.notes });
  };

  const saveEdit = (id: string, isRecurring: boolean) => {
    if (isRecurring) {
      updateRecurringIncome(id, editForm);
    } else {
      updateIncome(monthIndex, id, editForm);
    }
    setEditingId(null);
  };

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white';

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-[#1E1E2E]">הכנסות</h3>
        <div className="flex items-center gap-2">
          {monthlyEntries.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`למחוק את כל ${monthlyEntries.length} הכנסות החודש?`)) {
                  clearIncome(monthIndex);
                }
              }}
              className="text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-3 py-1.5 rounded-lg border border-blush-dark/30 transition-colors cursor-pointer"
            >
              מחק הכל
            </button>
          )}
          <button
            onClick={() => { setShowForm(!showForm); setErrors([]); }}
            className="flex items-center gap-1.5 bg-sage-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#8AAA7A] transition-colors cursor-pointer shadow-sm"
          >
            <PlusIcon />
            הוסף הכנסה
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
          {errors.length > 0 && (
            <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              נא למלא: {errors.join(', ')}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תאריך</label>
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">מקור הכנסה</label>
              <input type="text" placeholder="למשל: משכורת" value={newEntry.source} onChange={(e) => setNewEntry({ ...newEntry, source: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">בן משפחה</label>
              <select value={newEntry.memberId} onChange={(e) => setNewEntry({ ...newEntry, memberId: e.target.value })} className={`${inputCls} cursor-pointer`}>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סכום (₪)</label>
              <input type="number" placeholder="0" value={newEntry.amount || ''} onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })} className={inputCls} min={0} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
              <input type="text" placeholder="אופציונלי" value={newEntry.notes} onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })} className={inputCls} />
            </div>
          </div>

          {/* Recurring toggle */}
          <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit" onClick={() => setNewEntry({ ...newEntry, isRecurring: !newEntry.isRecurring })}>
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${newEntry.isRecurring ? 'bg-sage-dark' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${newEntry.isRecurring ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-[#4A4A60] flex items-center gap-1.5">
              <RepeatIcon />
              הכנסה קבועה (תופיע בכל חודש)
            </span>
          </label>

          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowForm(false); setErrors([]); setNewEntry(emptyForm(defaultMemberId)); }} className="text-sm text-[#6B6B8A] hover:text-[#1E1E2E] px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              ביטול
            </button>
            <button onClick={handleAdd} className="bg-sage-dark text-white rounded-lg px-5 py-1.5 text-sm font-medium hover:bg-[#8AAA7A] transition-colors cursor-pointer shadow-sm">
              שמור
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-100">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-lavender-light text-[#4A4A60]">
              <th className="px-4 py-2.5 text-right font-semibold text-xs">תאריך</th>
              <th className="px-4 py-2.5 text-right font-semibold text-xs">מקור הכנסה</th>
              <th className="px-4 py-2.5 text-right font-semibold text-xs">בן משפחה</th>
              <th className="px-4 py-2.5 text-right font-semibold text-xs">סכום</th>
              <th className="px-4 py-2.5 text-right font-semibold text-xs">הערות</th>
              <th className="px-4 py-2.5 text-center font-semibold text-xs w-28">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {allEntries.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-[#9090A8] py-10 bg-white text-sm">
                  אין הכנסות — לחץ על &quot;הוסף הכנסה&quot; כדי להתחיל
                </td>
              </tr>
            )}
            {allEntries.map((entry, idx) => {
              const isRecurring = !!entry.isRecurring;
              return (
                <tr key={entry.id} className={`border-b border-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-lavender-light/30`}>
                  {editingId === entry.id ? (
                    <>
                      <td className="px-4 py-2"><input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputCls} /></td>
                      <td className="px-4 py-2"><input type="text" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <select value={editForm.memberId} onChange={(e) => setEditForm({ ...editForm, memberId: e.target.value })} className={`${inputCls} cursor-pointer`}>
                          {familyMembers.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className={inputCls} min={0} /></td>
                      <td className="px-4 py-2"><input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className={inputCls} /></td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => saveEdit(entry.id, isRecurring)} className="text-xs text-white bg-sage-dark hover:bg-[#8AAA7A] px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium">שמור</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-[#6B6B8A] hover:text-[#1E1E2E] px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">ביטול</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-[#4A4A60]">{entry.date}</td>
                      <td className="px-4 py-2.5 font-medium text-[#1E1E2E]">
                        <div className="flex items-center gap-2">
                          {entry.source}
                          {isRecurring && (
                            <span className="inline-flex items-center gap-1 bg-sage-light text-[#5A7A4A] text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                              <RepeatIcon />
                              קבוע
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[#4A4A60]">{getMemberName(entry.memberId)}</td>
                      <td className="px-4 py-2.5 font-semibold text-[#1E1E2E]">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-2.5 text-[#9090A8] text-xs">{entry.notes}</td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="flex items-center gap-1 text-xs text-lavender-dark hover:text-[#5B52A0] hover:bg-lavender-light px-2 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            <EditIcon />
                            עריכה
                          </button>
                          <button
                            onClick={() => {
                              const msg = isRecurring
                                ? `למחוק את "${entry.source}" מכל החודשים?`
                                : 'למחוק הכנסה זו?';
                              if (window.confirm(msg)) {
                                isRecurring
                                  ? deleteRecurringIncome(entry.id)
                                  : deleteIncome(monthIndex, entry.id);
                              }
                            }}
                            className="flex items-center gap-1 text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-2 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            <TrashIcon />
                            {isRecurring ? 'בטל קבוע' : 'מחיקה'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-sage-light/50 font-semibold border-t border-gray-200">
              <td className="px-4 py-2.5 text-[#4A4A60] text-sm" colSpan={3}>סה&quot;כ הכנסות</td>
              <td className="px-4 py-2.5 text-[#1E1E2E] font-bold">{formatCurrency(totalIncome)}</td>
              <td className="px-4 py-2.5" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
