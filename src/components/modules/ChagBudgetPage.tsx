import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { ChagBudget } from '../../types';

const CHAG_PRESETS = [
  { name: 'ראש השנה', emoji: '🍎', month: 9 },
  { name: 'סוכות', emoji: '🌿', month: 10 },
  { name: 'חנוכה', emoji: '🕎', month: 12 },
  { name: 'פורים', emoji: '🎭', month: 3 },
  { name: 'פסח', emoji: '🫓', month: 4 },
  { name: 'שבועות', emoji: '📜', month: 6 },
  { name: 'חג אחר', emoji: '✡️', month: 0 },
];

const ITEM_PRESETS = ['מתנות', 'בגדים', 'אוכל וסיעוד', 'נסיעות', 'קניות', 'שמחות', 'אחר'];

const currentYear = new Date().getFullYear();

const emptyBudget = (): Omit<ChagBudget, 'id'> => ({
  chagName: 'ראש השנה',
  year: currentYear,
  items: [],
  notes: '',
});

export default function ChagBudgetPage() {
  const chagBudgets = useFinanceStore((s) => s.chagBudgets);
  const addChagBudget = useFinanceStore((s) => s.addChagBudget);
  const updateChagBudget = useFinanceStore((s) => s.updateChagBudget);
  const deleteChagBudget = useFinanceStore((s) => s.deleteChagBudget);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<ChagBudget, 'id'>>(emptyBudget());
  const [newItemName, setNewItemName] = useState('');
  const [newItemBudget, setNewItemBudget] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editSpent, setEditSpent] = useState<{ id: string; itemIdx: number; val: number } | null>(null);

  const inputCls = 'border border-gray-200 rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

  const addItem = () => {
    if (!newItemName || newItemBudget <= 0) return;
    setForm((f) => ({ ...f, items: [...f.items, { name: newItemName, budget: newItemBudget, spent: 0 }] }));
    setNewItemName('');
    setNewItemBudget(0);
  };

  const removeItem = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const handleAdd = () => {
    if (!form.chagName || form.items.length === 0) return;
    addChagBudget(form);
    setForm(emptyBudget());
    setShowAdd(false);
  };

  const saveSpent = (budgetId: string, itemIdx: number, val: number) => {
    const budget = chagBudgets.find((b) => b.id === budgetId);
    if (!budget) return;
    const items = budget.items.map((it, i) => i === itemIdx ? { ...it, spent: val } : it);
    updateChagBudget(budgetId, { items });
    setEditSpent(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">תקציב חגים</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">תכנן תקציב לכל חג — מתנות, בגדים, אוכל ונסיעות</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-[#C89E50] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#B08A40] cursor-pointer shadow-sm">
          + חג חדש
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">הוסף תקציב לחג</h3>

          <div className="flex gap-2 flex-wrap mb-3">
            {CHAG_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setForm((f) => ({ ...f, chagName: p.name }))}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${form.chagName === p.name ? 'border-[#C89E50] bg-amber-50 text-[#B08A40]' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                {p.emoji} {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם החג</label>
              <input type="text" value={form.chagName} onChange={(e) => setForm((f) => ({ ...f, chagName: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שנה</label>
              <input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className={inputCls} min={2020} max={2040} />
            </div>
          </div>

          <p className="text-xs font-medium text-[#6B6B8A] mb-2">פריטי תקציב</p>
          {form.items.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#B08A40] font-medium">{formatCurrency(item.budget)}</span>
                    <button onClick={() => removeItem(idx)} className="text-[#9090A8] hover:text-red-500 cursor-pointer text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 mb-2">
            {ITEM_PRESETS.map((p) => (
              <button key={p} onClick={() => setNewItemName(p)} className="text-xs bg-gray-100 hover:bg-amber-100 text-[#6B6B8A] px-2 py-1 rounded-lg cursor-pointer">{p}</button>
            ))}
          </div>
          <div className="flex gap-2 items-end mb-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם הפריט</label>
              <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="למשל: מתנות" className={inputCls} />
            </div>
            <div className="w-28">
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תקציב (₪)</label>
              <input type="number" value={newItemBudget || ''} onChange={(e) => setNewItemBudget(Number(e.target.value))} className={inputCls} min={0} />
            </div>
            <button onClick={addItem} className="bg-[#C89E50] text-white px-4 py-1.5 rounded-lg text-sm cursor-pointer font-medium">+ הוסף</button>
          </div>

          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="אופציונלי" className={inputCls} />
          </div>

          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowAdd(false); setForm(emptyBudget()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleAdd} disabled={form.items.length === 0} className="bg-[#C89E50] text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50">שמור</button>
          </div>
        </div>
      )}

      {chagBudgets.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">✡️</div>
          <p className="text-sm font-medium">אין תקציבי חגים</p>
          <p className="text-xs mt-1">הוסף תקציב לחג הקרוב</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chagBudgets.map((budget) => {
            const totalBudget = budget.items.reduce((s, i) => s + i.budget, 0);
            const totalSpent = budget.items.reduce((s, i) => s + i.spent, 0);
            const pct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
            const isExpanded = expandedId === budget.id;
            const barColor = pct >= 100 ? '#E06060' : pct >= 80 ? '#C89E50' : '#5A9A42';

            return (
              <div key={budget.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1 bg-[#C89E50]" />
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-[#1E1E2E]">
                        {CHAG_PRESETS.find((p) => p.name === budget.chagName)?.emoji || '✡️'} {budget.chagName} {budget.year}
                      </h3>
                      {budget.notes && <p className="text-xs text-[#9090A8] mt-0.5">{budget.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: barColor }}>{formatCurrency(totalSpent)}</p>
                      <p className="text-xs text-[#9090A8]">מתוך {formatCurrency(totalBudget)}</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : budget.id)}
                    className="text-xs text-[#6B6B8A] hover:text-[#1E1E2E] mb-2 cursor-pointer"
                  >
                    {isExpanded ? '▲ הסתר פרטים' : `▼ ${budget.items.length} פריטים`}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 mt-2">
                      {budget.items.map((item, idx) => {
                        const itemPct = item.budget > 0 ? Math.min(100, Math.round((item.spent / item.budget) * 100)) : 0;
                        const isEditingSpent = editSpent?.id === budget.id && editSpent.itemIdx === idx;
                        return (
                          <div key={idx} className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="font-medium text-[#1E1E2E]">{item.name}</span>
                              <div className="flex items-center gap-2">
                                {isEditingSpent ? (
                                  <input
                                    type="number"
                                    autoFocus
                                    value={editSpent.val}
                                    onChange={(e) => setEditSpent({ ...editSpent, val: Number(e.target.value) })}
                                    onBlur={() => saveSpent(budget.id, idx, editSpent.val)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') saveSpent(budget.id, idx, editSpent.val); }}
                                    className="w-24 border border-[#C89E50] rounded px-2 py-0.5 text-sm text-left"
                                    dir="ltr"
                                  />
                                ) : (
                                  <button
                                    onClick={() => setEditSpent({ id: budget.id, itemIdx: idx, val: item.spent })}
                                    className="text-xs text-[#6B6B8A] hover:text-[#1E1E2E] cursor-pointer"
                                  >
                                    שולם: <span className="font-semibold text-[#1E1E2E]">{formatCurrency(item.spent)}</span>
                                  </button>
                                )}
                                <span className="text-xs text-[#9090A8]">/ {formatCurrency(item.budget)}</span>
                                <span className="text-xs font-semibold" style={{ color: itemPct >= 100 ? '#E06060' : itemPct >= 80 ? '#C89E50' : '#5A9A42' }}>{itemPct}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${itemPct}%`, backgroundColor: itemPct >= 100 ? '#E06060' : itemPct >= 80 ? '#C89E50' : '#5A9A42' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button onClick={() => { if (window.confirm(`למחוק תקציב ל${budget.chagName}?`)) deleteChagBudget(budget.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 cursor-pointer">מחיקה</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
