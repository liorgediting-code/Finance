import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

function formatCurrencyShort(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `₪${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `₪${(v / 1_000).toFixed(0)}K`;
  return `₪${v.toFixed(0)}`;
}

export default function NetWorthTrackerPage() {
  const {
    netWorthHistory,
    addNetWorthSnapshot,
    deleteNetWorthSnapshot,
    savingsFunds,
    mortgages,
    debts,
    lifeGoals,
    savingsVehicles,
    installments,
  } = useFinanceStore(
    useShallow((s) => ({
      netWorthHistory: s.netWorthHistory,
      addNetWorthSnapshot: s.addNetWorthSnapshot,
      deleteNetWorthSnapshot: s.deleteNetWorthSnapshot,
      savingsFunds: s.savingsFunds,
      mortgages: s.mortgages,
      debts: s.debts,
      lifeGoals: s.lifeGoals,
      savingsVehicles: s.savingsVehicles,
      installments: s.installments,
    }))
  );

  // Compute current net worth from store
  const currentAssets =
    savingsFunds.reduce((s, f) => s + f.savedAmount, 0) +
    savingsVehicles.reduce((s, v) => s + v.balance, 0) +
    lifeGoals.reduce((s, g) => s + g.savedAmount, 0);

  const currentLiabilities =
    mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0) +
    debts.reduce((s, d) => s + d.balance, 0) +
    installments.reduce((s, inst) => {
      const remaining = inst.numPayments - inst.paidPayments;
      return s + remaining * (inst.totalAmount / inst.numPayments);
    }, 0);

  const currentNetWorth = currentAssets - currentLiabilities;

  const [showAdd, setShowAdd] = useState(false);
  const [notes, setNotes] = useState('');
  const [overrideAssets, setOverrideAssets] = useState('');
  const [overrideLiabilities, setOverrideLiabilities] = useState('');
  const [useOverride, setUseOverride] = useState(false);

  const handleSaveSnapshot = () => {
    const assets = useOverride && overrideAssets ? Number(overrideAssets) : currentAssets;
    const liabilities = useOverride && overrideLiabilities ? Number(overrideLiabilities) : currentLiabilities;
    addNetWorthSnapshot({
      date: new Date().toISOString().slice(0, 10),
      assets,
      liabilities,
      netWorth: assets - liabilities,
      notes,
    });
    setShowAdd(false);
    setNotes('');
    setOverrideAssets('');
    setOverrideLiabilities('');
    setUseOverride(false);
  };

  const chartData = netWorthHistory.map((snap) => ({
    date: snap.date.slice(0, 7),
    netWorth: snap.netWorth,
    assets: snap.assets,
    liabilities: snap.liabilities,
    label: new Date(snap.date).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' }),
  }));

  const latest = netWorthHistory[netWorthHistory.length - 1];
  const prev = netWorthHistory[netWorthHistory.length - 2];
  const change = latest && prev ? latest.netWorth - prev.netWorth : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📈</div>
          <div>
            <h1 className="text-xl font-bold text-[#1E1E2E]">מעקב שווי נטו</h1>
            <p className="text-xs text-[#9090A8] mt-0.5">עקוב אחר צמיחת הנכסים שלך לאורך זמן</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#7B6DC8] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#5B52A0] cursor-pointer shadow-sm"
        >
          + הוסף נקודת זמן
        </button>
      </div>

      {/* Current snapshot */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-[#5A9A42]" />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">נכסים כעת</p>
            <p className="text-lg font-bold text-[#5A9A42]">{formatCurrency(currentAssets)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1 bg-red-400" />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">התחייבויות כעת</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(currentLiabilities)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-1" style={{ backgroundColor: currentNetWorth >= 0 ? '#7B6DC8' : '#E06060' }} />
          <div className="p-3">
            <p className="text-xs text-[#9090A8]">שווי נטו כעת</p>
            <p className="text-lg font-bold" style={{ color: currentNetWorth >= 0 ? '#7B6DC8' : '#E06060' }}>
              {formatCurrency(currentNetWorth)}
            </p>
            {change !== null && (
              <p className={`text-[10px] font-medium ${change >= 0 ? 'text-[#5A9A42]' : 'text-red-500'}`}>
                {change >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(change))} מהפעם הקודמת
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Add snapshot form */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5 border border-[#7B6DC8]/20">
          <h3 className="text-sm font-semibold text-[#1E1E2E] mb-3">הוסף נקודת זמן — {new Date().toLocaleDateString('he-IL')}</h3>

          <div className="p-3 bg-lavender-light rounded-lg mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B6B8A]">נכסים מחושבים</span>
              <span className="font-bold text-[#5A9A42]">{formatCurrency(currentAssets)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#6B6B8A]">התחייבויות מחושבות</span>
              <span className="font-bold text-red-500">{formatCurrency(currentLiabilities)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1 border-t border-lavender-dark/20 pt-1">
              <span className="text-[#6B6B8A] font-medium">שווי נטו</span>
              <span className="font-black text-[#7B6DC8]">{formatCurrency(currentNetWorth)}</span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#6B6B8A] mb-3 cursor-pointer">
            <input type="checkbox" checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} className="accent-lavender-dark" />
            ערוך ערכים ידנית (כולל נכסים שאינם במערכת)
          </label>

          {useOverride && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סה&quot;כ נכסים (₪)</label>
                <input type="number" value={overrideAssets} onChange={(e) => setOverrideAssets(e.target.value)} placeholder={String(currentAssets)} className={INPUT_CLS} min={0} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סה&quot;כ התחייבויות (₪)</label>
                <input type="number" value={overrideLiabilities} onChange={(e) => setOverrideLiabilities(e.target.value)} placeholder={String(currentLiabilities)} className={INPUT_CLS} min={0} />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות (אופציונלי)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="למשל: לאחר מכירת הרכב" className={INPUT_CLS} />
          </div>

          <div className="flex gap-2 justify-end">
            <button onClick={() => { setShowAdd(false); setUseOverride(false); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleSaveSnapshot} className="bg-[#7B6DC8] text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer">שמור נקודת זמן</button>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <p className="text-sm font-semibold text-[#1E1E2E] mb-4">שווי נטו לאורך זמן</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F8" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9090A8' }} />
              <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 10, fill: '#9090A8' }} width={55} />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'netWorth' ? 'שווי נטו' : name === 'assets' ? 'נכסים' : 'התחייבויות',
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8E8F0' }}
              />
              <Line type="monotone" dataKey="assets" stroke="#5A9A42" strokeWidth={2} dot={false} name="assets" />
              <Line type="monotone" dataKey="liabilities" stroke="#E06060" strokeWidth={2} dot={false} name="liabilities" />
              <Line type="monotone" dataKey="netWorth" stroke="#7B6DC8" strokeWidth={2.5} dot={{ r: 3, fill: '#7B6DC8' }} name="netWorth" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            {[{ color: '#5A9A42', label: 'נכסים' }, { color: '#E06060', label: 'התחייבויות' }, { color: '#7B6DC8', label: 'שווי נטו' }].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-xs text-[#6B6B8A]">
                <div className="w-3 h-0.5 rounded" style={{ backgroundColor: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      ) : netWorthHistory.length === 1 ? (
        <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-200">
          <p className="text-sm text-amber-700">הוסף עוד נקודת זמן אחת כדי לראות את הגרף</p>
        </div>
      ) : null}

      {/* History list */}
      {netWorthHistory.length === 0 ? (
        <div className="text-center py-12 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm font-medium">עדיין אין נקודות זמן שמורות</p>
          <p className="text-xs mt-1">לחץ על &quot;הוסף נקודת זמן&quot; לתיעוד השווי הנטו שלך</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-[#1E1E2E]">היסטוריה</p>
          </div>
          <div className="divide-y divide-gray-50">
            {[...netWorthHistory].reverse().map((snap) => (
              <div key={snap.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-[#1E1E2E]">
                      {new Date(snap.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className={`text-sm font-bold ${snap.netWorth >= 0 ? 'text-[#7B6DC8]' : 'text-red-500'}`}>
                      {formatCurrency(snap.netWorth)}
                    </span>
                  </div>
                  <p className="text-xs text-[#9090A8] mt-0.5">
                    נכסים: {formatCurrency(snap.assets)} | התחייבויות: {formatCurrency(snap.liabilities)}
                    {snap.notes && ` | ${snap.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => { if (window.confirm('למחוק נקודה זו?')) deleteNetWorthSnapshot(snap.id); }}
                  className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 cursor-pointer flex-shrink-0"
                >
                  מחק
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
