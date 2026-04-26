import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { Mortgage, MortgageTrack, MortgageTrackType } from '../../types';

const TRACK_TYPE_NAMES: Record<MortgageTrackType, string> = {
  prime: 'פריים',
  fixed: 'קבועה לא צמודה',
  cpi: 'קבועה צמודה מדד',
  variable: 'משתנה כל 5 שנים',
};

const emptyMortgage = (): Omit<Mortgage, 'id'> => ({ name: 'משכנתא', tracks: [], notes: '' });
const emptyTrack = (): Omit<MortgageTrack, 'id'> => ({ type: 'prime', balance: 0, monthlyPayment: 0, interestRate: 0, remainingMonths: 0, notes: '' });

function PayoffProjection({ monthlyPayment, extraPayment, balance, rateAnnual }: { monthlyPayment: number; extraPayment: number; balance: number; rateAnnual: number }) {
  const monthlyRate = rateAnnual / 100 / 12;
  if (balance <= 0 || monthlyPayment <= 0) return null;

  const calcMonths = (extra: number) => {
    let bal = balance;
    let months = 0;
    const payment = monthlyPayment + extra;
    while (bal > 0 && months < 600) {
      bal = bal * (1 + monthlyRate) - payment;
      months++;
    }
    return months;
  };

  const baseMonths = calcMonths(0);
  const extraMonths = calcMonths(extraPayment);
  const saved = baseMonths - extraMonths;

  if (baseMonths >= 600) return null;

  const years = Math.floor(baseMonths / 12);
  const months = baseMonths % 12;

  return (
    <div className="bg-lavender-light/50 rounded-lg p-3 text-xs text-[#4A4A60] mt-2">
      <p>תחזית סיום: בעוד <span className="font-semibold">{years} שנה ו-{months} חודשים</span></p>
      {extraPayment > 0 && saved > 0 && (
        <p className="text-green-700 mt-1">
          תוספת של {formatCurrency(extraPayment)}/חודש תקצר ב-<span className="font-semibold">{Math.floor(saved / 12)} שנה ו-{saved % 12} חודשים</span>
        </p>
      )}
    </div>
  );
}

export default function MortgagePage() {
  const mortgages = useFinanceStore((s) => s.mortgages);
  const addMortgage = useFinanceStore((s) => s.addMortgage);
  const deleteMortgage = useFinanceStore((s) => s.deleteMortgage);
  const updateMortgage = useFinanceStore((s) => s.updateMortgage);
  const addMortgageTrack = useFinanceStore((s) => s.addMortgageTrack);
  const updateMortgageTrack = useFinanceStore((s) => s.updateMortgageTrack);
  const deleteMortgageTrack = useFinanceStore((s) => s.deleteMortgageTrack);

  const [showAdd, setShowAdd] = useState(false);
  const [mortgageForm, setMortgageForm] = useState<Omit<Mortgage, 'id'>>(emptyMortgage());
  const [showTrackForm, setShowTrackForm] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState<Omit<MortgageTrack, 'id'>>(emptyTrack());
  const [editTrack, setEditTrack] = useState<{ mortgageId: string; trackId: string } | null>(null);
  const [editTrackForm, setEditTrackForm] = useState<Omit<MortgageTrack, 'id'>>(emptyTrack());
  const [extraPayment, setExtraPayment] = useState(500);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

  const totalMonthly = mortgages.reduce((s, m) => s + m.tracks.reduce((ts, t) => ts + t.monthlyPayment, 0), 0);
  const totalBalance = mortgages.reduce((s, m) => s + m.tracks.reduce((ts, t) => ts + t.balance, 0), 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">משכנתא</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">מעקב אחר מסלולי המשכנתא שלך</p>
        </div>
        {mortgages.length === 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] cursor-pointer shadow-sm"
          >
            + הוסף משכנתא
          </button>
        )}
      </div>

      {totalMonthly > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-lavender-dark" />
            <div className="p-4">
              <p className="text-xs text-[#9090A8] mb-1">תשלום חודשי כולל</p>
              <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalMonthly)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-blush-dark" />
            <div className="p-4">
              <p className="text-xs text-[#9090A8] mb-1">יתרת חוב כוללת</p>
              <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">הוסף משכנתא</h3>
          <input type="text" value={mortgageForm.name} onChange={(e) => setMortgageForm({ ...mortgageForm, name: e.target.value })} placeholder="שם המשכנתא" className={inputCls} />
          <div className="flex gap-2 mt-3 justify-end">
            <button onClick={() => setShowAdd(false)} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={() => { if (mortgageForm.name) { addMortgage(mortgageForm); setShowAdd(false); setMortgageForm(emptyMortgage()); } }} className="bg-lavender-dark text-white px-4 py-1.5 rounded-lg text-sm font-medium cursor-pointer">הוסף</button>
          </div>
        </div>
      )}

      {mortgages.length === 0 && !showAdd && (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-sm">לחץ על &quot;הוסף משכנתא&quot; כדי להתחיל</p>
        </div>
      )}

      {mortgages.map((mortgage) => {
        const mortgageMonthly = mortgage.tracks.reduce((s, t) => s + t.monthlyPayment, 0);
        const mortgageBalance = mortgage.tracks.reduce((s, t) => s + t.balance, 0);

        return (
          <div key={mortgage.id} className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
            <div className="h-1 bg-lavender-dark" />
            <div className="p-4">
              {renamingId === mortgage.id ? (
                <div className="flex gap-2 mb-3">
                  <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { updateMortgage(mortgage.id, { name: renameValue }); setRenamingId(null); } }} className={inputCls} />
                  <button onClick={() => { updateMortgage(mortgage.id, { name: renameValue }); setRenamingId(null); }} className="bg-sage-dark text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer">שמור</button>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <button onClick={() => { setRenamingId(mortgage.id); setRenameValue(mortgage.name); }} className="text-base font-bold text-[#1E1E2E] hover:text-lavender-dark cursor-pointer">{mortgage.name}</button>
                    <p className="text-xs text-[#9090A8]">{mortgage.tracks.length} מסלולים | {formatCurrency(mortgageMonthly)}/חודש | יתרה: {formatCurrency(mortgageBalance)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowTrackForm(mortgage.id)} className="text-xs bg-lavender-light text-[#5B52A0] px-3 py-1.5 rounded-lg hover:bg-lavender cursor-pointer font-medium">+ מסלול</button>
                    <button onClick={() => { if (window.confirm('למחוק משכנתא זו?')) deleteMortgage(mortgage.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1.5 rounded-lg cursor-pointer">מחק</button>
                  </div>
                </div>
              )}

              {/* Add track form */}
              {showTrackForm === mortgage.id && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-[#6B6B8A] mb-2">הוסף מסלול</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-[#9090A8] block mb-1">סוג מסלול</label>
                      <select value={trackForm.type} onChange={(e) => setTrackForm({ ...trackForm, type: e.target.value as MortgageTrackType })} className={inputCls}>
                        {Object.entries(TRACK_TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[#9090A8] block mb-1">יתרת חוב (₪)</label>
                      <input type="number" value={trackForm.balance || ''} onChange={(e) => setTrackForm({ ...trackForm, balance: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#9090A8] block mb-1">תשלום חודשי (₪)</label>
                      <input type="number" value={trackForm.monthlyPayment || ''} onChange={(e) => setTrackForm({ ...trackForm, monthlyPayment: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#9090A8] block mb-1">ריבית שנתית (%)</label>
                      <input type="number" step="0.1" value={trackForm.interestRate || ''} onChange={(e) => setTrackForm({ ...trackForm, interestRate: Number(e.target.value) })} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#9090A8] block mb-1">חודשים שנותרו</label>
                      <input type="number" value={trackForm.remainingMonths || ''} onChange={(e) => setTrackForm({ ...trackForm, remainingMonths: Number(e.target.value) })} className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 justify-end">
                    <button onClick={() => setShowTrackForm(null)} className="text-xs text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                    <button onClick={() => { addMortgageTrack(mortgage.id, trackForm); setShowTrackForm(null); setTrackForm(emptyTrack()); }} className="text-xs bg-lavender-dark text-white px-3 py-1.5 rounded-lg cursor-pointer">הוסף</button>
                  </div>
                </div>
              )}

              {/* Tracks */}
              {mortgage.tracks.map((track) => (
                <div key={track.id} className="border border-gray-100 rounded-lg p-3 mb-2">
                  {editTrack?.trackId === track.id ? (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                        <select value={editTrackForm.type} onChange={(e) => setEditTrackForm({ ...editTrackForm, type: e.target.value as MortgageTrackType })} className={inputCls}>
                          {Object.entries(TRACK_TYPE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input type="number" placeholder="יתרת חוב" value={editTrackForm.balance || ''} onChange={(e) => setEditTrackForm({ ...editTrackForm, balance: Number(e.target.value) })} className={inputCls} />
                        <input type="number" placeholder="תשלום חודשי" value={editTrackForm.monthlyPayment || ''} onChange={(e) => setEditTrackForm({ ...editTrackForm, monthlyPayment: Number(e.target.value) })} className={inputCls} />
                        <input type="number" step="0.1" placeholder="ריבית %" value={editTrackForm.interestRate || ''} onChange={(e) => setEditTrackForm({ ...editTrackForm, interestRate: Number(e.target.value) })} className={inputCls} />
                        <input type="number" placeholder="חודשים שנותרו" value={editTrackForm.remainingMonths || ''} onChange={(e) => setEditTrackForm({ ...editTrackForm, remainingMonths: Number(e.target.value) })} className={inputCls} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditTrack(null)} className="text-xs text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                        <button onClick={() => { updateMortgageTrack(mortgage.id, track.id, editTrackForm); setEditTrack(null); }} className="text-xs bg-sage-dark text-white px-3 py-1.5 rounded-lg cursor-pointer">שמור</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-semibold text-[#1E1E2E] bg-lavender-light px-2 py-0.5 rounded-full">{TRACK_TYPE_NAMES[track.type]}</span>
                          <span className="text-xs text-[#9090A8]">ריבית {track.interestRate}%</span>
                          <span className="text-xs text-[#9090A8]">נותרו {track.remainingMonths} חודשים</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-bold text-[#1E1E2E]">{formatCurrency(track.monthlyPayment)}<span className="text-xs font-normal text-[#9090A8]">/חודש</span></span>
                          <span className="text-[#9090A8] text-xs">יתרה: {formatCurrency(track.balance)}</span>
                        </div>
                        <PayoffProjection monthlyPayment={track.monthlyPayment} extraPayment={extraPayment} balance={track.balance} rateAnnual={track.interestRate} />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditTrack({ mortgageId: mortgage.id, trackId: track.id }); setEditTrackForm({ type: track.type, balance: track.balance, monthlyPayment: track.monthlyPayment, interestRate: track.interestRate, remainingMonths: track.remainingMonths, notes: track.notes }); }} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1 rounded cursor-pointer">עריכה</button>
                        <button onClick={() => deleteMortgageTrack(mortgage.id, track.id)} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded cursor-pointer">מחק</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Early payoff calculator */}
              {mortgage.tracks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-[#6B6B8A]">מה אם אוסיף</p>
                    <input
                      type="number"
                      value={extraPayment}
                      onChange={(e) => setExtraPayment(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1 w-24 text-xs text-right"
                    />
                    <p className="text-xs text-[#6B6B8A]">₪/חודש נוסף?</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {mortgages.length > 0 && (
        <button onClick={() => setShowAdd(true)} className="text-sm text-[#5B52A0] hover:underline cursor-pointer">+ הוסף משכנתא נוספת</button>
      )}
    </div>
  );
}
