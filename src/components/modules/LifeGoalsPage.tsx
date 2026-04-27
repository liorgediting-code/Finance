import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { LifeGoal } from '../../types';

const GOAL_PRESETS = [
  { emoji: '✈️', name: 'חופשה', color: '#4A90C0' },
  { emoji: '🚗', name: 'רכב', color: '#5A9A42' },
  { emoji: '🏠', name: 'דירה', color: '#7B6DC8' },
  { emoji: '💒', name: 'חתונה', color: '#C85590' },
  { emoji: '📚', name: 'חינוך', color: '#C89E50' },
  { emoji: '🛡️', name: 'קרן חירום', color: '#4AACAC' },
  { emoji: '🎯', name: 'מטרה אישית', color: '#E06060' },
];

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

const emptyGoal = (): Omit<LifeGoal, 'id'> => ({
  name: '',
  emoji: '🎯',
  targetAmount: 0,
  savedAmount: 0,
  targetDate: '',
  monthlyContribution: 0,
  color: '#7B6DC8',
  notes: '',
});

function monthsUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr + '-01');
  const now = new Date();
  return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

function requiredMonthly(goal: Pick<LifeGoal, 'targetAmount' | 'savedAmount' | 'targetDate'>): number {
  const remaining = goal.targetAmount - goal.savedAmount;
  if (remaining <= 0) return 0;
  const months = monthsUntil(goal.targetDate);
  if (!goal.targetDate || months <= 0) return 0;
  return Math.ceil(remaining / months);
}

function projectedDateStr(goal: LifeGoal): string {
  const remaining = goal.targetAmount - goal.savedAmount;
  if (remaining <= 0) return 'הגעת למטרה!';
  if (goal.monthlyContribution <= 0) return '—';
  const months = Math.ceil(remaining / goal.monthlyContribution);
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

interface GoalFormProps {
  f: Omit<LifeGoal, 'id'>;
  setF: (v: Omit<LifeGoal, 'id'>) => void;
}

function GoalForm({ f, setF }: GoalFormProps) {
  const required = requiredMonthly(f);

  return (
    <div>
      <p className="text-xs font-medium text-[#6B6B8A] mb-2">בחר/י קטגוריה</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {GOAL_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setF({ ...f, emoji: p.emoji, name: f.name || p.name, color: p.color })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${f.emoji === p.emoji ? 'border-lavender-dark bg-lavender-light text-[#5B52A0]' : 'border-gray-200 hover:bg-gray-50'}`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם המטרה</label>
          <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="למשל: חופשה בתאילנד" className={INPUT_CLS} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יעד (₪)</label>
          <input type="number" value={f.targetAmount || ''} onChange={(e) => setF({ ...f, targetAmount: Number(e.target.value) })} placeholder="0" className={INPUT_CLS} min={0} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">חסכתי עד כה (₪)</label>
          <input type="number" value={f.savedAmount || ''} onChange={(e) => setF({ ...f, savedAmount: Number(e.target.value) })} placeholder="0" className={INPUT_CLS} min={0} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">תאריך יעד</label>
          <input type="month" value={f.targetDate} onChange={(e) => setF({ ...f, targetDate: e.target.value })} className={INPUT_CLS} />
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">
            הפקדה חודשית (₪)
            {required > 0 && (
              <span className="text-[#5B52A0] font-semibold mr-1">— נדרש: {formatCurrency(required)}/חודש</span>
            )}
          </label>
          <div className="flex gap-2 items-center">
            <input type="number" value={f.monthlyContribution || ''} onChange={(e) => setF({ ...f, monthlyContribution: Number(e.target.value) })} placeholder={required > 0 ? String(required) : '0'} className={INPUT_CLS} min={0} />
            {required > 0 && f.monthlyContribution !== required && (
              <button type="button" onClick={() => setF({ ...f, monthlyContribution: required })} className="flex-shrink-0 text-xs bg-lavender-light text-[#5B52A0] px-2.5 py-2 rounded-lg cursor-pointer hover:bg-lavender-dark hover:text-white transition-colors whitespace-nowrap">
                קבע {formatCurrency(required)}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">הערות</label>
          <input type="text" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="אופציונלי" className={INPUT_CLS} />
        </div>
      </div>
    </div>
  );
}

export default function LifeGoalsPage() {
  const lifeGoals = useFinanceStore((s) => s.lifeGoals);
  const addLifeGoal = useFinanceStore((s) => s.addLifeGoal);
  const updateLifeGoal = useFinanceStore((s) => s.updateLifeGoal);
  const deleteLifeGoal = useFinanceStore((s) => s.deleteLifeGoal);
  const depositToLifeGoal = useFinanceStore((s) => s.depositToLifeGoal);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<LifeGoal, 'id'>>(emptyGoal());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Omit<LifeGoal, 'id'>>(emptyGoal());
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);

  const totalTarget = lifeGoals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = lifeGoals.reduce((s, g) => s + g.savedAmount, 0);
  const totalMonthly = lifeGoals.reduce((s, g) => s + g.monthlyContribution, 0);

  const handleAdd = () => {
    if (!form.name || form.targetAmount <= 0) return;
    addLifeGoal(form);
    setForm(emptyGoal());
    setShowAdd(false);
  };

  const handleDeposit = (id: string) => {
    if (depositAmount <= 0) return;
    depositToLifeGoal(id, depositAmount);
    setDepositGoalId(null);
    setDepositAmount(0);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">מטרות חיים</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">חופשה, רכב, דירה, חתונה — הגדר יעדים ועקוב אחר ההתקדמות</p>
        </div>
        <button onClick={() => { setShowAdd(true); setForm(emptyGoal()); }} className="flex items-center gap-1.5 bg-[#7B6DC8] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#6B5CB8] cursor-pointer shadow-sm">
          + מטרה חדשה
        </button>
      </div>

      {lifeGoals.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-[#9090A8]">סה&quot;כ יעדים</p>
            <p className="text-lg font-bold text-[#1E1E2E]">{formatCurrency(totalTarget)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-[#9090A8]">נחסך עד כה</p>
            <p className="text-lg font-bold text-sage-dark">{formatCurrency(totalSaved)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
            <p className="text-xs text-[#9090A8]">הפקדה חודשית</p>
            <p className="text-lg font-bold text-[#5B52A0]">{formatCurrency(totalMonthly)}</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-3">מטרה חדשה</h3>
          <GoalForm f={form} setF={setForm} />
          <div className="flex gap-2 mt-4 justify-end">
            <button onClick={() => { setShowAdd(false); setForm(emptyGoal()); }} className="text-sm text-[#6B6B8A] px-4 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
            <button onClick={handleAdd} disabled={!form.name || form.targetAmount <= 0} className="bg-[#7B6DC8] text-white px-5 py-1.5 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50">שמור</button>
          </div>
        </div>
      )}

      {lifeGoals.length === 0 && !showAdd ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-sm font-medium">אין מטרות עדיין</p>
          <p className="text-xs mt-1">הוסף מטרה כדי לעקוב אחר ההתקדמות</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lifeGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100)) : 0;
            const remaining = goal.targetAmount - goal.savedAmount;
            const isDone = remaining <= 0;
            const projected = projectedDateStr(goal);
            const monthsLeft = goal.targetDate ? monthsUntil(goal.targetDate) : 0;
            const needed = requiredMonthly(goal);
            const onTrack = needed > 0 && goal.monthlyContribution >= needed;
            const offTrack = needed > 0 && goal.monthlyContribution > 0 && goal.monthlyContribution < needed;

            return (
              <div key={goal.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1.5" style={{ backgroundColor: goal.color }} />
                {editingId === goal.id ? (
                  <div className="p-4">
                    <GoalForm f={editForm} setF={setEditForm} />
                    <div className="flex gap-2 mt-3 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-sm text-[#6B6B8A] px-3 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">ביטול</button>
                      <button onClick={() => { updateLifeGoal(goal.id, editForm); setEditingId(null); }} className="bg-sage-dark text-white px-4 py-1.5 rounded-lg text-sm cursor-pointer">שמור</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{goal.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-[#1E1E2E]">{goal.name}</h3>
                          {goal.targetDate && (
                            <p className="text-xs text-[#9090A8]">
                              יעד: {new Date(goal.targetDate + '-01').toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                              {monthsLeft > 0 && ` · ${monthsLeft} חודשים`}
                            </p>
                          )}
                        </div>
                      </div>
                      {isDone && <span className="text-xs bg-sage-light text-sage-dark px-2 py-0.5 rounded-full font-medium">✓ הושג!</span>}
                      {onTrack && !isDone && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ בקצב טוב</span>}
                      {offTrack && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚠ לא מספיק</span>}
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-[#9090A8] mb-1">
                        <span>{formatCurrency(goal.savedAmount)} מתוך {formatCurrency(goal.targetAmount)}</span>
                        <span className="font-semibold" style={{ color: goal.color }}>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                      </div>
                    </div>

                    {!isDone && (
                      <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-[#6B6B8A] mb-3 space-y-1">
                        <p>נשאר: <span className="font-semibold text-[#1E1E2E]">{formatCurrency(remaining)}</span></p>
                        {needed > 0 && (
                          <p>
                            נדרש להגיע בזמן:{' '}
                            <span className={`font-semibold ${offTrack ? 'text-amber-600' : 'text-[#5B52A0]'}`}>{formatCurrency(needed)}/חודש</span>
                            {goal.monthlyContribution > 0 && goal.monthlyContribution !== needed && (
                              <span className="text-[#9090A8]"> (מוגדר: {formatCurrency(goal.monthlyContribution)})</span>
                            )}
                          </p>
                        )}
                        {!goal.targetDate && goal.monthlyContribution > 0 && projected !== '—' && (
                          <p>בקצב הנוכחי תגיע: <span className="font-semibold" style={{ color: goal.color }}>{projected}</span></p>
                        )}
                      </div>
                    )}

                    {depositGoalId === goal.id ? (
                      <div className="flex gap-2 mb-2">
                        <input
                          type="number"
                          autoFocus
                          value={depositAmount || ''}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          placeholder="סכום להפקדה"
                          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark"
                        />
                        <button onClick={() => handleDeposit(goal.id)} className="bg-sage-dark text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer">הוסף</button>
                        <button onClick={() => setDepositGoalId(null)} className="text-[#9090A8] px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer text-sm">ביטול</button>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {!isDone && (
                          <button onClick={() => { setDepositGoalId(goal.id); setDepositAmount(0); }} className="text-xs bg-sage-light text-sage-dark px-3 py-1.5 rounded-lg hover:bg-sage hover:text-white cursor-pointer font-medium transition-colors">+ הפקדה</button>
                        )}
                        <button onClick={() => { setEditingId(goal.id); setEditForm({ name: goal.name, emoji: goal.emoji, targetAmount: goal.targetAmount, savedAmount: goal.savedAmount, targetDate: goal.targetDate, monthlyContribution: goal.monthlyContribution, color: goal.color, notes: goal.notes ?? '' }); }} className="text-xs text-[#9090A8] hover:text-[#4A4A60] px-2 py-1.5 rounded-lg hover:bg-gray-100 cursor-pointer">עריכה</button>
                        <button onClick={() => { if (window.confirm('למחוק מטרה זו?')) deleteLifeGoal(goal.id); }} className="text-xs text-[#9090A8] hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 cursor-pointer mr-auto">מחיקה</button>
                      </div>
                    )}
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
