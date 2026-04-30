import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { SavingsChallenge } from '../../types';

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
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

const WEEKS = Array.from({ length: 52 }, (_, i) => i + 1);

function ChallengeGrid({ challenge }: { challenge: SavingsChallenge }) {
  const toggleChallengeWeek = useFinanceStore((s) => s.toggleChallengeWeek);

  const totalPossible = WEEKS.reduce((sum, w) => sum + w * challenge.weeklyBase, 0);
  const totalSaved = challenge.completedWeeks.reduce((sum, w) => sum + w * challenge.weeklyBase, 0);
  const pct = totalPossible > 0 ? Math.round((totalSaved / totalPossible) * 100) : 0;
  const isComplete = challenge.completedWeeks.length === 52;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-lavender-dark" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#1E1E2E] text-base">{challenge.name}</h3>
            <p className="text-xs text-[#9090A8] mt-0.5">
              בסיס שבועי: {formatCurrency(challenge.weeklyBase)} · סה"כ אפשרי: {formatCurrency(totalPossible)}
            </p>
          </div>
          {isComplete && (
            <span className="text-2xl animate-bounce" title="הושלם!">🎉</span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-[#6B6B8A] mb-1.5">
            <span>{challenge.completedWeeks.length} / 52 שבועות</span>
            <span className="font-semibold text-lavender-dark">{formatCurrency(totalSaved)} נחסכו</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: isComplete ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #B0A8C8, #7B6DC8)',
              }}
            />
          </div>
          <p className="text-[11px] text-[#9090A8] mt-1 text-left" dir="ltr">{pct}%</p>
        </div>

        {/* 52-week grid */}
        <div className="grid grid-cols-13 gap-1" style={{ gridTemplateColumns: 'repeat(13, 1fr)' }}>
          {WEEKS.map((week) => {
            const done = challenge.completedWeeks.includes(week);
            const amount = week * challenge.weeklyBase;
            return (
              <button
                key={week}
                onClick={() => toggleChallengeWeek(challenge.id, week)}
                title={`שבוע ${week}: ${formatCurrency(amount)}`}
                className={`aspect-square rounded text-[9px] font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  done
                    ? 'bg-lavender-dark text-white shadow-sm scale-105'
                    : 'bg-gray-100 text-[#9090A8] hover:bg-lavender-light hover:text-lavender-dark'
                }`}
              >
                {week}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <p className="text-[10px] text-[#9090A8] mt-3 text-center">
          לחץ על שבוע לסימון כבוצע. שבוע 1 = {formatCurrency(challenge.weeklyBase)}, שבוע 52 = {formatCurrency(52 * challenge.weeklyBase)}
        </p>
      </div>
    </div>
  );
}

export default function SavingsChallengePage() {
  const savingsChallenges = useFinanceStore(useShallow((s) => s.savingsChallenges));
  const addSavingsChallenge = useFinanceStore((s) => s.addSavingsChallenge);
  const deleteSavingsChallenge = useFinanceStore((s) => s.deleteSavingsChallenge);

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('אתגר 52 שבועות');
  const [weeklyBase, setWeeklyBase] = useState(50);

  const handleCreate = () => {
    if (!name.trim()) return;
    addSavingsChallenge({
      name: name.trim(),
      weeklyBase,
      startDate: new Date().toISOString().slice(0, 10),
      completedWeeks: [],
      notes: '',
    });
    setShowNew(false);
    setName('אתגר 52 שבועות');
    setWeeklyBase(50);
  };

  const totalPossible = Array.from({ length: 52 }, (_, i) => (i + 1) * weeklyBase).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">אתגר חיסכון</h1>
          <p className="text-sm text-[#9090A8] mt-1">
            אתגר 52 שבועות — חוסכים קצת יותר כל שבוע
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-lavender-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
        >
          <PlusIcon />
          אתגר חדש
        </button>
      </div>

      {/* Explainer */}
      {savingsChallenges.length === 0 && !showNew && (
        <div className="bg-lavender-light/40 border border-lavender rounded-xl p-6 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <h2 className="text-base font-semibold text-[#1E1E2E] mb-2">איך עובד אתגר 52 שבועות?</h2>
          <p className="text-sm text-[#6B6B8A] leading-relaxed max-w-md mx-auto">
            בשבוע הראשון חוסכים סכום בסיסי, בשבוע השני כפול, וכן הלאה עד 52 שבועות.
            עם בסיס של ₪50: שבוע 1 = ₪50, שבוע 2 = ₪100... שבוע 52 = ₪2,600.
            <br />
            <strong className="text-[#1E1E2E]">סה"כ בשנה: ₪68,900!</strong>
          </p>
          <button
            onClick={() => setShowNew(true)}
            className="mt-4 bg-lavender-dark text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer"
          >
            התחל אתגר
          </button>
        </div>
      )}

      {/* New challenge form */}
      {showNew && (
        <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-lavender">
          <h3 className="font-semibold text-[#1E1E2E] mb-4">אתגר חדש</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם האתגר</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">סכום בסיסי לשבוע (₪)</label>
              <input
                type="number"
                value={weeklyBase}
                min={1}
                onChange={(e) => setWeeklyBase(Math.max(1, Number(e.target.value)))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
              />
              <p className="text-xs text-[#9090A8] mt-1">
                סה"כ צפוי בסיום: {formatCurrency(totalPossible)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="flex-1 bg-lavender-dark text-white py-2 rounded-lg text-sm font-medium hover:bg-[#9088B8] disabled:opacity-50 cursor-pointer transition-colors"
            >
              צור אתגר
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 text-sm text-[#6B6B8A] hover:text-[#1E1E2E] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Challenges list */}
      {savingsChallenges.map((challenge) => (
        <div key={challenge.id}>
          <ChallengeGrid challenge={challenge} />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                if (window.confirm(`למחוק את האתגר "${challenge.name}"?`)) {
                  deleteSavingsChallenge(challenge.id);
                }
              }}
              className="flex items-center gap-1 text-xs text-[#9090A8] hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <TrashIcon />
              מחק אתגר
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
