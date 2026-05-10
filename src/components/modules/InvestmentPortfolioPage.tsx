import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';
import { formatCurrency } from '../../utils/formatters';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { PortfolioItem, PortfolioItemType } from '../../types';

const TYPE_META: Record<PortfolioItemType, { he: string; emoji: string; color: string }> = {
  stocks:      { he: 'מניות',         emoji: '📈', color: '#50A878' },
  bonds:       { he: 'אג"ח',          emoji: '📋', color: '#4A90C0' },
  real_estate: { he: 'נדל"ן',         emoji: '🏠', color: '#E8B040' },
  crypto:      { he: 'קריפטו',        emoji: '₿',  color: '#F7931A' },
  mutual_fund: { he: 'קרן נאמנות',   emoji: '🏦', color: '#7B6DC8' },
  etf:         { he: 'תעודת סל',      emoji: '📊', color: '#5AADE0' },
  other:       { he: 'אחר',           emoji: '💼', color: '#A0A0B0' },
};

const ILS_RATES: Record<string, number> = {
  ILS: 1, USD: 3.70, EUR: 4.05, GBP: 4.80, CHF: 4.20,
  JPY: 0.025, CAD: 2.70, AUD: 2.40, AED: 1.00,
};

const CURRENCIES = ['ILS', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'AED'];

function toILS(amount: number, currency: string): number {
  return amount * (ILS_RATES[currency] ?? 1);
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white placeholder:text-[#9090A8]';
const selectCls = `${inputCls} appearance-none`;

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

const EMPTY_FORM = {
  name: '', type: 'stocks' as PortfolioItemType,
  ticker: '', quantity: '', purchasePrice: '', currentValue: '',
  purchaseDate: '', currency: 'ILS', notes: '',
};

export default function InvestmentPortfolioPage() {
  const portfolioItems = useFinanceStore(useShallow((s) => s.portfolioItems));
  const addPortfolioItem = useFinanceStore((s) => s.addPortfolioItem);
  const updatePortfolioItem = useFinanceStore((s) => s.updatePortfolioItem);
  const deletePortfolioItem = useFinanceStore((s) => s.deletePortfolioItem);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const totalValueILS = portfolioItems.reduce((sum, p) => sum + toILS(p.currentValue, p.currency), 0);
  const totalCostILS = portfolioItems.reduce((sum, p) =>
    p.purchasePrice != null ? sum + toILS(p.purchasePrice, p.currency) : sum, 0);
  const totalGainILS = totalValueILS - totalCostILS;
  const gainPercent = totalCostILS > 0 ? (totalGainILS / totalCostILS) * 100 : 0;

  const byType: Record<string, number> = {};
  portfolioItems.forEach((p) => {
    byType[p.type] = (byType[p.type] ?? 0) + toILS(p.currentValue, p.currency);
  });
  const pieData = Object.entries(byType).map(([type, value]) => ({
    name: TYPE_META[type as PortfolioItemType].he,
    value: Math.round(value),
    color: TYPE_META[type as PortfolioItemType].color,
  }));

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name, type: item.type,
      ticker: item.ticker ?? '', quantity: item.quantity != null ? String(item.quantity) : '',
      purchasePrice: item.purchasePrice != null ? String(item.purchasePrice) : '',
      currentValue: String(item.currentValue), purchaseDate: item.purchaseDate ?? '',
      currency: item.currency, notes: item.notes,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.currentValue) return;
    const payload: Omit<PortfolioItem, 'id'> = {
      name: form.name.trim(),
      type: form.type,
      ticker: form.ticker.trim() || undefined,
      quantity: form.quantity ? Number(form.quantity) : undefined,
      purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
      currentValue: Number(form.currentValue),
      purchaseDate: form.purchaseDate || undefined,
      currency: form.currency,
      notes: form.notes.trim(),
    };
    if (editingId) {
      updatePortfolioItem(editingId, payload);
    } else {
      addPortfolioItem(payload);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const f = (field: keyof typeof form, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">תיק השקעות</h1>
          <p className="text-sm text-[#9090A8] mt-0.5">מעקב ידני אחר כל נכסי ההשקעה שלך</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-[#50A878] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#3d8a60] transition-colors cursor-pointer"
        >
          <PlusIcon /> הוסף נכס
        </button>
      </div>

      {portfolioItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs text-[#9090A8] mb-1">שווי תיק כולל</p>
            <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalValueILS)}</p>
            <p className="text-xs text-[#9090A8] mt-0.5">{portfolioItems.length} נכסים</p>
          </div>
          {totalCostILS > 0 && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-xs text-[#9090A8] mb-1">עלות מקורית</p>
                <p className="text-2xl font-bold text-[#1E1E2E]">{formatCurrency(totalCostILS)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-xs text-[#9090A8] mb-1">רווח / הפסד</p>
                <p className={`text-2xl font-bold ${totalGainILS >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalGainILS >= 0 ? '+' : ''}{formatCurrency(totalGainILS)}
                </p>
                <p className={`text-xs mt-0.5 ${totalGainILS >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {portfolioItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-[#1E1E2E] mb-3">הקצאת נכסים</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: unknown) => typeof v === 'number' ? formatCurrency(v) : ''} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm font-semibold text-[#1E1E2E] mb-3">אחזקות</p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {portfolioItems.map((item) => {
                const valueILS = toILS(item.currentValue, item.currency);
                const pct = totalValueILS > 0 ? (valueILS / totalValueILS) * 100 : 0;
                const meta = TYPE_META[item.type];
                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="text-lg w-7 text-center flex-shrink-0">{meta.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E1E2E] truncate">{item.name}</p>
                      <p className="text-xs text-[#9090A8]">{meta.he} · {pct.toFixed(0)}%</p>
                    </div>
                    <p className="text-sm font-semibold text-[#1E1E2E] text-left">{formatCurrency(valueILS)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {portfolioItems.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3">📊</div>
            <p className="text-[#1E1E2E] font-medium">עוד אין נכסים בתיק</p>
            <p className="text-sm text-[#9090A8] mt-1">הוסף מניות, אג"ח, נדל"ן, קריפטו ועוד</p>
            <button onClick={openAdd} className="mt-4 text-sm text-[#50A878] underline cursor-pointer">+ הוסף נכס ראשון</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">נכס</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">סוג</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">שווי נוכחי</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#6B6B8A]">רווח/הפסד</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {portfolioItems.map((item) => {
                  const valueILS = toILS(item.currentValue, item.currency);
                  const costILS = item.purchasePrice != null ? toILS(item.purchasePrice, item.currency) : null;
                  const gainILS = costILS != null ? valueILS - costILS : null;
                  const gainPct = costILS && costILS > 0 ? ((valueILS - costILS) / costILS) * 100 : null;
                  const meta = TYPE_META[item.type];
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{meta.emoji}</span>
                          <div>
                            <p className="font-medium text-[#1E1E2E]">{item.name}</p>
                            {item.ticker && <p className="text-xs text-[#9090A8]">{item.ticker}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: meta.color + '20', color: meta.color }}>
                          {meta.he}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#1E1E2E]">
                        {formatCurrency(valueILS)}
                        {item.currency !== 'ILS' && (
                          <span className="block text-xs text-[#9090A8]">{item.currentValue.toLocaleString()} {item.currency}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {gainILS != null ? (
                          <span className={gainILS >= 0 ? 'text-green-600' : 'text-red-500'}>
                            {gainILS >= 0 ? '+' : ''}{formatCurrency(gainILS)}
                            {gainPct != null && <span className="text-xs mr-1">({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)</span>}
                          </span>
                        ) : (
                          <span className="text-[#9090A8] text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEdit(item)} className="text-xs text-[#9090A8] hover:text-lavender-dark cursor-pointer">עריכה</button>
                          <button onClick={() => { if (window.confirm(`למחוק את "${item.name}"?`)) deletePortfolioItem(item.id); }} className="text-xs text-[#9090A8] hover:text-red-500 cursor-pointer"><TrashIcon /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()} dir="rtl">
            <h2 className="text-lg font-bold text-[#1E1E2E] mb-4">{editingId ? 'עריכת נכס' : 'הוספת נכס'}</h2>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-[#6B6B8A] mb-1 block">שם הנכס *</label>
                  <input className={inputCls} value={form.name} onChange={(e) => f('name', e.target.value)} placeholder={'לדוגמה: Apple, ת"א 125, דירה בתל אביב'} dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">סוג *</label>
                  <select className={selectCls} value={form.type} onChange={(e) => f('type', e.target.value)} dir="rtl">
                    {(Object.keys(TYPE_META) as PortfolioItemType[]).map((t) => (
                      <option key={t} value={t}>{TYPE_META[t].he}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">טיקר / סמל (אופציונלי)</label>
                  <input className={inputCls} value={form.ticker} onChange={(e) => f('ticker', e.target.value)} placeholder="AAPL" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">מטבע</label>
                  <select className={selectCls} value={form.currency} onChange={(e) => f('currency', e.target.value)} dir="ltr">
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">שווי נוכחי *</label>
                  <input className={inputCls} type="number" min="0" value={form.currentValue} onChange={(e) => f('currentValue', e.target.value)} placeholder="0" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">עלות רכישה מקורית</label>
                  <input className={inputCls} type="number" min="0" value={form.purchasePrice} onChange={(e) => f('purchasePrice', e.target.value)} placeholder="0 (לחישוב רווח)" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">כמות יחידות</label>
                  <input className={inputCls} type="number" min="0" value={form.quantity} onChange={(e) => f('quantity', e.target.value)} placeholder="לדוגמה: 100" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B8A] mb-1 block">תאריך רכישה</label>
                  <input className={inputCls} type="date" value={form.purchaseDate} onChange={(e) => f('purchaseDate', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-[#6B6B8A] mb-1 block">הערות</label>
                  <input className={inputCls} value={form.notes} onChange={(e) => f('notes', e.target.value)} placeholder="הערה חופשית" dir="rtl" />
                </div>
              </div>
              {form.currency !== 'ILS' && form.currentValue && (
                <p className="text-xs text-[#9090A8] bg-gray-50 rounded-lg px-3 py-2">
                  ≈ {formatCurrency(Number(form.currentValue) * (ILS_RATES[form.currency] ?? 1))} (שער משוער)
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} className="flex-1 bg-[#50A878] text-white font-medium py-2 rounded-lg hover:bg-[#3d8a60] transition-colors cursor-pointer">שמור</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-[#6B6B8A] font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-[#9090A8] text-center">
        שערי מטבע משוערים בלבד · עדכן ידנית את שווי הנכסים לפי השוק
      </p>
    </div>
  );
}
