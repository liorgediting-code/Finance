import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

const INPUT_CLS = 'border border-gray-200 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white';

function calcMonthsToGoal(target: number, current: number, monthly: number, annualRate: number): number {
  const remaining = target - current;
  if (remaining <= 0) return 0;
  if (monthly <= 0) return Infinity;
  if (annualRate === 0) return Math.ceil(remaining / monthly);
  const r = annualRate / 100 / 12;
  // FV of annuity: FV = PMT * ((1+r)^n - 1) / r + PV*(1+r)^n
  // Solve numerically
  let bal = current;
  let months = 0;
  while (bal < target && months < 600) {
    bal = bal * (1 + r) + monthly;
    months++;
  }
  return months;
}

function monthsToLabel(months: number): string {
  if (!isFinite(months) || months >= 600) return 'לא ניתן להגיע ללא חיסכון';
  const years = Math.floor(months / 12);
  const mo = months % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} שנה`);
  if (mo > 0) parts.push(`${mo} חודשים`);
  return parts.join(' ו-') || 'פחות מחודש';
}

function projectedDate(monthsFromNow: number): string {
  if (!isFinite(monthsFromNow) || monthsFromNow >= 600) return '—';
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
}

function totalInterest(current: number, monthly: number, months: number, rate: number): number {
  if (rate === 0) return 0;
  const r = rate / 100 / 12;
  let bal = current;
  for (let i = 0; i < months; i++) bal = bal * (1 + r) + monthly;
  return bal - current - monthly * months;
}

const PRESET_GOALS = [
  { emoji: '🏠', name: 'הון עצמי לדירה', amount: 500000 },
  { emoji: '✈️', name: 'חופשת חלומות', amount: 30000 },
  { emoji: '🚗', name: 'רכב חדש', amount: 100000 },
  { emoji: '💒', name: 'חתונה', amount: 80000 },
  { emoji: '📚', name: 'קרן לימודים', amount: 50000 },
  { emoji: '🛡️', name: 'קרן חירום', amount: 0 },
];

export default function GoalSimulatorPage() {
  const { lifeGoals, savingsFunds } = useFinanceStore(
    useShallow((s) => ({ lifeGoals: s.lifeGoals, savingsFunds: s.savingsFunds }))
  );

  const [target, setTarget] = useState(100000);
  const [current, setCurrent] = useState(0);
  const [monthly, setMonthly] = useState(2000);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [annualRate, setAnnualRate] = useState(4);
  const [linkedGoalId, setLinkedGoalId] = useState('');

  // When a life goal is selected, pre-fill the values
  const handleSelectGoal = (goalId: string) => {
    setLinkedGoalId(goalId);
    if (!goalId) return;
    const goal = lifeGoals.find((g) => g.id === goalId);
    if (goal) {
      setTarget(goal.targetAmount);
      setCurrent(goal.savedAmount);
      setMonthly(goal.monthlyContribution);
    }
  };

  const baseMonths = useMemo(
    () => calcMonthsToGoal(target, current, monthly, annualRate),
    [target, current, monthly, annualRate]
  );

  const extraMonths = useMemo(
    () => calcMonthsToGoal(target, current, monthly + extraMonthly, annualRate),
    [target, current, monthly, extraMonthly, annualRate]
  );

  const baseInterest = useMemo(
    () => totalInterest(current, monthly, isFinite(baseMonths) ? baseMonths : 0, annualRate),
    [current, monthly, baseMonths, annualRate]
  );

  const extraInterest = useMemo(
    () => totalInterest(current, monthly + extraMonthly, isFinite(extraMonths) ? extraMonths : 0, annualRate),
    [current, monthly, extraMonthly, extraMonths, annualRate]
  );

  const monthsSaved = isFinite(baseMonths) && isFinite(extraMonths) ? baseMonths - extraMonths : 0;
  const moneySaved = isFinite(baseMonths) && isFinite(extraMonths)
    ? monthsSaved * monthly - (extraMonthly > 0 ? monthsSaved * extraMonthly : 0)
    : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-3xl">🧮</div>
        <div>
          <h1 className="text-xl font-bold text-[#1E1E2E]">סימולטור יעדי חיסכון</h1>
          <p className="text-xs text-[#9090A8] mt-0.5">גלה מתי תגיע למטרה — ומה ישנה אם תחסוך קצת יותר</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Preset goals */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-[#6B6B8A] mb-3 uppercase tracking-wider">בחר מטרה מוכנה</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_GOALS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    if (p.amount > 0) setTarget(p.amount);
                    setLinkedGoalId('');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 text-sm hover:bg-lavender-light hover:border-lavender-dark cursor-pointer transition-colors"
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
            {lifeGoals.length > 0 && (
              <div>
                <label className="text-xs text-[#6B6B8A] block mb-1">או בחר מהמטרות שלי</label>
                <select
                  value={linkedGoalId}
                  onChange={(e) => handleSelectGoal(e.target.value)}
                  className={`${INPUT_CLS} cursor-pointer`}
                >
                  <option value="">-- בחר מטרה --</option>
                  {lifeGoals.map((g) => (
                    <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">פרמטרים</p>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יעד חיסכון (₪)</label>
              <input type="number" value={target || ''} onChange={(e) => setTarget(Number(e.target.value))} min={0} placeholder="100,000" className={INPUT_CLS} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">חיסכון קיים (₪)</label>
              <input type="number" value={current || ''} onChange={(e) => setCurrent(Number(e.target.value))} min={0} placeholder="0" className={INPUT_CLS} />
              {savingsFunds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {savingsFunds.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCurrent(f.savedAmount)}
                      className="text-[10px] text-[#7B6DC8] bg-lavender-light rounded px-1.5 py-0.5 cursor-pointer hover:bg-lavender-dark hover:text-white"
                    >
                      {f.name}: {formatCurrency(f.savedAmount)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">חיסכון חודשי (₪)</label>
              <input type="number" value={monthly || ''} onChange={(e) => setMonthly(Number(e.target.value))} min={0} placeholder="2,000" className={INPUT_CLS} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs font-medium text-[#6B6B8A]">תשואה שנתית משוערת (%)</label>
                <span className="text-xs font-bold text-[#7B6DC8]">{annualRate}%</span>
              </div>
              <input
                type="range" min={0} max={15} step={0.5}
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-lavender-dark cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#9090A8]">
                <span>0% (ריבית אפס)</span>
                <span>4% (ממוצע)</span>
                <span>15%</span>
              </div>
            </div>
          </div>

          {/* Extra savings slider */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">מה אם אוסיף עוד...</p>
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium text-[#6B6B8A]">תוספת חודשית</label>
              <span className="text-xs font-bold text-[#5A9A42]">+{formatCurrency(extraMonthly)}</span>
            </div>
            <input
              type="range" min={0} max={5000} step={100}
              value={extraMonthly}
              onChange={(e) => setExtraMonthly(Number(e.target.value))}
              className="w-full accent-sage-dark cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#9090A8]">
              <span>₪0</span>
              <span>₪2,500</span>
              <span>₪5,000</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Base scenario */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-1 bg-[#7B6DC8]" />
            <div className="p-4">
              <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">תוצאה — תוכנית נוכחית</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B8A]">זמן עד היעד</span>
                  <span className="font-bold text-[#1E1E2E]">{monthsToLabel(baseMonths)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B8A]">תאריך משוער</span>
                  <span className="font-semibold text-[#1E1E2E]">{projectedDate(baseMonths)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B6B8A]">סה&quot;כ שתחסוך</span>
                  <span className="font-semibold text-[#1E1E2E]">
                    {isFinite(baseMonths) ? formatCurrency(current + monthly * baseMonths) : '—'}
                  </span>
                </div>
                {annualRate > 0 && isFinite(baseMonths) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B8A]">רווח מריבית</span>
                    <span className="font-semibold text-[#5A9A42]">{formatCurrency(baseInterest)}</span>
                  </div>
                )}
              </div>

              {/* Visual progress */}
              {isFinite(baseMonths) && target > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-[#9090A8] mb-1">
                    <span>{formatCurrency(current)}</span>
                    <span>{formatCurrency(target)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#7B6DC8] rounded-full"
                      style={{ width: `${Math.min(100, target > 0 ? (current / target) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#9090A8] mt-1">
                    {target > 0 ? ((current / target) * 100).toFixed(0) : 0}% הושגו מתוך היעד
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Extra scenario */}
          {extraMonthly > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border-2 border-[#5A9A42]/30">
              <div className="h-1 bg-[#5A9A42]" />
              <div className="p-4">
                <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
                  עם +{formatCurrency(extraMonthly)}/חודש
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B8A]">זמן עד היעד</span>
                    <span className="font-bold text-[#5A9A42]">{monthsToLabel(extraMonths)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B8A]">תאריך משוער</span>
                    <span className="font-semibold text-[#1E1E2E]">{projectedDate(extraMonths)}</span>
                  </div>
                  {annualRate > 0 && isFinite(extraMonths) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#6B6B8A]">רווח מריבית</span>
                      <span className="font-semibold text-[#5A9A42]">{formatCurrency(extraInterest)}</span>
                    </div>
                  )}
                </div>

                {isFinite(baseMonths) && isFinite(extraMonths) && monthsSaved > 0 && (
                  <div className="mt-4 p-3 bg-[#F0F7EC] rounded-lg border border-[#5A9A42]/30">
                    <p className="text-xs font-bold text-[#5A9A42]">
                      🎯 תגיע ל-{formatCurrency(target)}{' '}
                      <span className="underline">{monthsSaved} חודשים מוקדם יותר</span>
                    </p>
                    {moneySaved > 0 && (
                      <p className="text-xs text-[#5A9A42] mt-1">
                        ותחסוך {formatCurrency(Math.abs(moneySaved))} בריבית
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-lavender-light rounded-xl p-4">
            <p className="text-xs font-semibold text-[#5B52A0] mb-2">💡 איך להאיץ את החיסכון</p>
            <ul className="space-y-1.5 text-xs text-[#6B6B8A]">
              <li>• העבר חיסכון חודשי בהוראת קבע ביום קבלת המשכורת</li>
              <li>• כל עלייה בשכר — העבר 50% לחיסכון</li>
              <li>• בדוק מה ניתן לקצץ מהוצאות שאינן הכרחיות</li>
              <li>• תשואה גבוהה יותר = פחות שנים לחכות</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
