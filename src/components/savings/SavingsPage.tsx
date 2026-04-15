import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsFund } from '../../types';

// ── Colour palette for funds ──────────────────────────────────────────────────
const FUND_COLORS = [
  { value: '#B8CCE0', label: 'כחול' },
  { value: '#C5CDB6', label: 'ירוק' },
  { value: '#D4D0E8', label: 'סגול' },
  { value: '#F2C4C4', label: 'ורוד' },
  { value: '#E8CFA8', label: 'בז\'' },
  { value: '#E8D890', label: 'צהוב' },
  { value: '#D4B8C4', label: 'ורד' },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" /><line x1="16.71" y1="13.88" x2="17" y2="14" />
    </svg>
  );
}

// ── Fund form (add / edit) ────────────────────────────────────────────────────
interface FundFormData {
  name: string;
  targetAmount: string;
  savedAmount: string;
  color: string;
  notes: string;
}

const emptyForm = (): FundFormData => ({
  name: '',
  targetAmount: '',
  savedAmount: '0',
  color: FUND_COLORS[0].value,
  notes: '',
});

interface FundFormProps {
  initial?: FundFormData;
  onSave: (data: FundFormData) => void;
  onCancel: () => void;
  title: string;
}

function FundForm({ initial, onSave, onCancel, title }: FundFormProps) {
  const [form, setForm] = useState<FundFormData>(initial ?? emptyForm());
  const [errors, setErrors] = useState<string[]>([]);

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white';

  const handleSave = () => {
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('שם');
    if (!form.targetAmount || Number(form.targetAmount) <= 0) errs.push('יעד');
    if (errs.length > 0) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm" dir="rtl">
      <h3 className="text-sm font-semibold text-[#1E1E2E] mb-4">{title}</h3>

      {errors.length > 0 && (
        <p className="text-red-500 text-xs mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          נא למלא: {errors.join(', ')}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם היעד</label>
          <input
            type="text"
            placeholder="למשל: חופשה לאירופה"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יעד סכום (₪)</label>
          <input
            type="number"
            placeholder="0"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            className={inputCls}
            min={1}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">כבר נחסך (₪)</label>
          <input
            type="number"
            placeholder="0"
            value={form.savedAmount}
            onChange={(e) => setForm({ ...form, savedAmount: e.target.value })}
            className={inputCls}
            min={0}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
          <input
            type="text"
            placeholder="אופציונלי"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>

      {/* Color picker */}
      <div className="mb-4">
        <label className="text-xs font-medium text-[#6B6B8A] mb-2 block">צבע</label>
        <div className="flex gap-2 flex-wrap">
          {FUND_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setForm({ ...form, color: c.value })}
              className={`w-8 h-8 rounded-full transition-all cursor-pointer border-2 ${
                form.color === c.value ? 'border-[#5B52A0] scale-110 shadow-md' : 'border-transparent'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-sm text-[#6B6B8A] hover:text-[#1E1E2E] px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          ביטול
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-5 py-1.5 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
        >
          שמור יעד
        </button>
      </div>
    </div>
  );
}

// ── Fund card ─────────────────────────────────────────────────────────────────
interface FundCardProps {
  fund: SavingsFund;
  onEdit: () => void;
  onDelete: () => void;
  onDeposit: (amount: number) => void;
}

function FundCard({ fund, onEdit, onDelete, onDeposit }: FundCardProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositAmt, setDepositAmt] = useState('');
  const [depositErr, setDepositErr] = useState('');

  const pct = fund.targetAmount > 0
    ? Math.min((fund.savedAmount / fund.targetAmount) * 100, 100)
    : 0;
  const remaining = Math.max(fund.targetAmount - fund.savedAmount, 0);
  const isComplete = pct >= 100;

  const handleDeposit = () => {
    const amt = parseFloat(depositAmt);
    if (!amt || amt <= 0) { setDepositErr('הכנס סכום תקין'); return; }
    onDeposit(amt);
    setDepositAmt('');
    setDepositErr('');
    setDepositOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" dir="rtl">
      {/* Colour accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: fund.color }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: fund.color + '55' }}>
              <span style={{ color: fund.color }} className="text-base font-bold">
                {fund.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1E2E] leading-tight">{fund.name}</h3>
              {fund.notes && (
                <p className="text-xs text-[#9090A8] mt-0.5">{fund.notes}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-xs text-lavender-dark hover:text-[#5B52A0] hover:bg-lavender-light px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <EditIcon /> ערוך
            </button>
            <button
              onClick={() => { if (window.confirm(`למחוק את "${fund.name}"?`)) onDelete(); }}
              className="flex items-center gap-1 text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-2 py-1 rounded-md transition-colors cursor-pointer"
            >
              <TrashIcon /> מחק
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-[#9090A8] mb-1.5">
            <span>{pct.toFixed(0)}% מהיעד</span>
            <span>{isComplete ? 'הושג!' : `נותר ${formatCurrency(remaining)}`}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${pct}%`,
                backgroundColor: isComplete ? '#6BBF6B' : fund.color,
              }}
            />
          </div>
        </div>

        {/* Amounts row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-[#9090A8] mb-0.5">נחסך</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(fund.savedAmount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-xs text-[#9090A8] mb-0.5">יעד</p>
            <p className="text-sm font-bold text-[#1E1E2E]">{formatCurrency(fund.targetAmount)}</p>
          </div>
        </div>

        {/* Deposit button */}
        {!isComplete && (
          <button
            onClick={() => { setDepositOpen((o) => !o); setDepositErr(''); }}
            className="flex items-center gap-1.5 w-full justify-center bg-gray-50 hover:bg-lavender-light text-[#4A4A60] hover:text-[#5B52A0] rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer border border-gray-200 hover:border-lavender"
          >
            <CoinsIcon />
            הפקד סכום
          </button>
        )}

        {isComplete && (
          <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-lg px-4 py-2 text-sm font-medium border border-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            יעד הושג!
          </div>
        )}

        {/* Inline deposit form */}
        {depositOpen && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {depositErr && (
              <p className="text-red-500 text-xs mb-2">{depositErr}</p>
            )}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="סכום להפקדה (₪)"
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
                min={1}
                autoFocus
              />
              <button
                onClick={handleDeposit}
                className="bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
              >
                הפקד
              </button>
              <button
                onClick={() => { setDepositOpen(false); setDepositAmt(''); setDepositErr(''); }}
                className="text-[#9090A8] hover:text-[#1E1E2E] px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SavingsPage() {
  const savingsFunds = useFinanceStore((s) => s.savingsFunds);
  const addSavingsFund = useFinanceStore((s) => s.addSavingsFund);
  const updateSavingsFund = useFinanceStore((s) => s.updateSavingsFund);
  const deleteSavingsFund = useFinanceStore((s) => s.deleteSavingsFund);
  const depositToFund = useFinanceStore((s) => s.depositToFund);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalTarget = savingsFunds.reduce((s, f) => s + f.targetAmount, 0);
  const totalSaved = savingsFunds.reduce((s, f) => s + f.savedAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const handleAdd = (data: FundFormData) => {
    addSavingsFund({
      name: data.name,
      targetAmount: Number(data.targetAmount),
      savedAmount: Number(data.savedAmount),
      color: data.color,
      notes: data.notes,
    });
    setShowAddForm(false);
  };

  const handleEdit = (id: string, data: FundFormData) => {
    updateSavingsFund(id, {
      name: data.name,
      targetAmount: Number(data.targetAmount),
      savedAmount: Number(data.savedAmount),
      color: data.color,
      notes: data.notes,
    });
    setEditingId(null);
  };

  return (
    <div dir="rtl">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">חסכונות</h1>
          <p className="text-sm text-[#9090A8] mt-0.5">ניהול יעדי חיסכון</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
        >
          <PlusIcon />
          יעד חדש
        </button>
      </div>

      {/* ── Overall summary (only when there are funds) ── */}
      {savingsFunds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="h-1 w-full bg-lavender-dark" />
          <div className="p-5">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
              סיכום כולל
            </p>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#6B6B8A]">
                {formatCurrency(totalSaved)} מתוך {formatCurrency(totalTarget)}
              </span>
              <span className="font-bold text-[#1E1E2E]">{overallPct.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-lavender-dark transition-all duration-700"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <p className="text-xs text-[#9090A8] mt-2">
              נותר לחסוך: <span className="font-semibold text-[#4A4A60]">{formatCurrency(totalTarget - totalSaved)}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Add form ── */}
      {showAddForm && (
        <FundForm
          title="יעד חיסכון חדש"
          onSave={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* ── Empty state ── */}
      {savingsFunds.length === 0 && !showAddForm && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-lavender-light flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-lavender-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-[#1E1E2E] mb-1">אין יעדי חיסכון עדיין</h3>
          <p className="text-sm text-[#9090A8] mb-4">צור יעד ראשון כדי להתחיל לעקוב אחרי החיסכון שלך</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 mx-auto bg-lavender-dark text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
          >
            <PlusIcon />
            הוסף יעד ראשון
          </button>
        </div>
      )}

      {/* ── Fund cards grid ── */}
      {savingsFunds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {savingsFunds.map((fund) => (
            editingId === fund.id ? (
              <div key={fund.id} className="md:col-span-2">
                <FundForm
                  title={`עריכת "${fund.name}"`}
                  initial={{
                    name: fund.name,
                    targetAmount: String(fund.targetAmount),
                    savedAmount: String(fund.savedAmount),
                    color: fund.color,
                    notes: fund.notes,
                  }}
                  onSave={(data) => handleEdit(fund.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <FundCard
                key={fund.id}
                fund={fund}
                onEdit={() => { setEditingId(fund.id); setShowAddForm(false); }}
                onDelete={() => deleteSavingsFund(fund.id)}
                onDeposit={(amt) => depositToFund(fund.id, amt, new Date().getMonth())}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}
