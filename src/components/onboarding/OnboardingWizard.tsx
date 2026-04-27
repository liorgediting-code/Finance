import { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useShallow } from 'zustand/react/shallow';

// ── Module catalogue ──────────────────────────────────────────────────────────

interface Module {
  id: string;
  emoji: string;
  label: string;
  desc: string;
}

const MODULES: Module[] = [
  { id: 'life-goals',       emoji: '🎯', label: 'מטרות חיים',      desc: 'חיסכון לדברים החשובים' },
  { id: 'debt-planner',     emoji: '💳', label: 'תכנון חובות',     desc: 'פירעון הלוואות חכם' },
  { id: 'mortgage',         emoji: '🏠', label: 'משכנתא',          desc: 'מעקב אחר המשכנתא' },
  { id: 'savings-vehicles', emoji: '🐷', label: 'חסכונות ופנסיה',  desc: 'קרן השתלמות, פנסיה' },
  { id: 'installments',     emoji: '📅', label: 'תשלומים',         desc: 'רכישות בתשלומים' },
  { id: 'chag-budget',      emoji: '✨', label: 'תקציב חגים',      desc: 'תכנון לחגים ואירועים' },
  { id: 'cashflow',         emoji: '📈', label: 'תחזית תזרים',     desc: 'הכנסות והוצאות עתידיות' },
  { id: 'annual-planner',   emoji: '📆', label: 'מתכנן שנתי',      desc: 'תקציב שנתי מלא' },
  { id: 'salary-slip',      emoji: '📄', label: 'ניתוח תלוש',      desc: 'הבנת רכיבי השכר' },
  { id: 'csv-import',       emoji: '📂', label: 'ייבוא CSV',        desc: 'ייבוא מהבנק ישירות' },
];

// ── Primary goal cards ────────────────────────────────────────────────────────

interface GoalCard {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  suggestedModules: string[];
}

const GOAL_CARDS: GoalCard[] = [
  {
    id: 'buy_home',
    emoji: '🏠',
    title: 'לקנות דירה / לנהל משכנתא',
    subtitle: 'חיסכון לדיור או מעקב אחר הלוואה קיימת',
    suggestedModules: ['mortgage', 'savings-vehicles', 'life-goals', 'cashflow'],
  },
  {
    id: 'pay_debt',
    emoji: '💳',
    title: 'להיפטר מחובות',
    subtitle: 'תכנון חכם לפירעון הלוואות וכרטיסי אשראי',
    suggestedModules: ['debt-planner', 'cashflow', 'annual-planner'],
  },
  {
    id: 'save_goal',
    emoji: '🎯',
    title: 'לחסוך ליעד ספציפי',
    subtitle: 'חופשה, רכב, חינוך ילדים וכל מה שחשוב לך',
    suggestedModules: ['life-goals', 'savings-vehicles', 'chag-budget'],
  },
  {
    id: 'track',
    emoji: '📊',
    title: 'לעקוב אחר ההוצאות',
    subtitle: 'להבין לאן הולך הכסף ולנהל תקציב',
    suggestedModules: ['csv-import', 'annual-planner', 'installments'],
  },
  {
    id: 'freedom',
    emoji: '🌴',
    title: 'חופש כלכלי / פנסיה מוקדמת',
    subtitle: 'בניית עצמאות פיננסית לטווח ארוך',
    suggestedModules: ['savings-vehicles', 'life-goals', 'cashflow', 'annual-planner'],
  },
];

// ── Step count ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5; // 0-4 (0=welcome, 1=goal, 2=family, 3=modules, 4=done)

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const familyMembers = useFinanceStore(useShallow((s) => s.familyMembers));
  const addFamilyMember = useFinanceStore((s) => s.addFamilyMember);
  const recurringIncomes = useFinanceStore(useShallow((s) => s.recurringIncomes));
  const months = useFinanceStore(useShallow((s) => s.months));

  const [step, setStep] = useState(0);
  const [memberName, setMemberName] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [enabledMods, setEnabledMods] = useState<string[]>(
    settings.enabledModules ?? MODULES.map((m) => m.id)
  );

  // Auto-skip for existing users who have data but haven't set hasCompletedOnboarding
  useEffect(() => {
    if (settings.hasCompletedOnboarding !== undefined) return;
    const hasData =
      familyMembers.length > 0 ||
      recurringIncomes.length > 0 ||
      Object.keys(months).length > 0;
    if (hasData) {
      updateSettings({ hasCompletedOnboarding: true });
    }
  }, [settings.hasCompletedOnboarding, familyMembers.length, recurringIncomes.length, Object.keys(months).length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (settings.hasCompletedOnboarding) return null;

  const handleGoalSelect = (goal: GoalCard) => {
    setSelectedGoal(goal.id);
    setEnabledMods(goal.suggestedModules);
  };

  const toggleModule = (id: string) => {
    setEnabledMods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleAddMember = () => {
    const name = memberName.trim();
    if (!name) return;
    addFamilyMember(name);
    setMemberName('');
  };

  const handleFinish = () => {
    if (monthlyTarget > 0) {
      updateSettings({ savingsGoal: { ...settings.savingsGoal, monthlyTarget } });
    }
    updateSettings({
      hasCompletedOnboarding: true,
      enabledModules: enabledMods,
      primaryGoal: selectedGoal ?? undefined,
    });
  };

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const canProceed =
    step === 0 ? true :
    step === 1 ? !!selectedGoal :
    true;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-[#1E1E2E]/80 to-[#3B3250]/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[95vh] flex flex-col">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 flex-shrink-0">
          <div
            className="h-1 bg-gradient-to-l from-lavender-dark to-[#7B8FD4] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4 px-6 flex-shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < step ? 'w-4 h-1.5 bg-lavender-dark' :
                i === step ? 'w-4 h-1.5 bg-lavender-dark' :
                'w-1.5 h-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">💰</div>
              <h2 className="text-2xl font-bold text-[#1E1E2E] mb-2">ברוכים הבאים!</h2>
              <p className="text-sm text-[#6B6B8A] leading-relaxed mb-6">
                ניהול פיננסי משפחתי חכם — עקוב אחר הכנסות, הוצאות, חסכונות, ומטרות חיים.
                נגדיר יחד את כל מה שצריך תוך 2 דקות.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { emoji: '☁️', title: 'מאובטח בענן', sub: 'הנתונים שלך תמיד איתך' },
                  { emoji: '📱', title: 'מובייל ודסקטופ', sub: 'עובד בכל מקום' },
                  { emoji: '🇮🇱', title: 'בעברית ובשקלים', sub: 'מותאם לישראל' },
                  { emoji: '⚡', title: 'עדכון בזמן אמת', sub: 'שיתוף עם בני משפחה' },
                ].map((f) => (
                  <div key={f.title} className="bg-lavender-light rounded-xl p-3 text-right">
                    <div className="text-xl mb-1">{f.emoji}</div>
                    <p className="text-xs font-semibold text-[#1E1E2E]">{f.title}</p>
                    <p className="text-[10px] text-[#9090A8]">{f.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Primary goal */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-1">מה המטרה הפיננסית שלך?</h2>
              <p className="text-sm text-[#6B6B8A] mb-4">נגדיר את הכלים שהכי רלוונטיים לך.</p>
              <div className="space-y-2">
                {GOAL_CARDS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGoalSelect(g)}
                    className={`w-full text-right p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                      selectedGoal === g.id
                        ? 'border-lavender-dark bg-lavender-light'
                        : 'border-gray-100 bg-white hover:border-lavender-dark/40 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{g.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${selectedGoal === g.id ? 'text-[#5B52A0]' : 'text-[#1E1E2E]'}`}>
                        {g.title}
                      </p>
                      <p className="text-xs text-[#9090A8] mt-0.5">{g.subtitle}</p>
                    </div>
                    {selectedGoal === g.id && (
                      <span className="text-lavender-dark text-lg flex-shrink-0">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Family members */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-1">מי גר בבית?</h2>
              <p className="text-sm text-[#6B6B8A] mb-4">הוסף שמות כדי לעקוב אחר הכנסות לפי אדם. ניתן לדלג.</p>
              {familyMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {familyMembers.map((m) => (
                    <span key={m.id} className="flex items-center gap-1.5 bg-lavender-light text-[#5B52A0] rounded-full px-3 py-1 text-sm font-medium">
                      {m.name} ✓
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); }}
                  placeholder="שם (למשל: ישראל, שרה...)"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark"
                  autoFocus
                />
                <button
                  onClick={handleAddMember}
                  disabled={!memberName.trim()}
                  className="bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-40"
                >
                  הוסף
                </button>
              </div>
              <p className="text-xs text-[#9090A8] mt-2">ניתן להוסיף ולערוך בהמשך בהגדרות.</p>
            </div>
          )}

          {/* Step 3: Module selection */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-1">אילו כלים תרצה להשתמש?</h2>
              <p className="text-sm text-[#6B6B8A] mb-1">
                {selectedGoal ? 'בחרנו עבורך כלים מומלצים — תוכל לשנות בכל עת.' : 'בחר את הכלים הרלוונטיים לך.'}
              </p>
              <p className="text-xs text-[#9090A8] mb-3">
                {enabledMods.length} מתוך {MODULES.length} כלים פעילים
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map((m) => {
                  const active = enabledMods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModule(m.id)}
                      className={`text-right p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        active
                          ? 'border-lavender-dark bg-lavender-light'
                          : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full flex-shrink-0 ${active ? 'bg-lavender-dark text-white' : 'bg-gray-100 text-[#9090A8]'}`}>
                          {active ? '✓' : ''}
                        </span>
                        <span className="text-lg">{m.emoji}</span>
                      </div>
                      <p className={`text-xs font-semibold ${active ? 'text-[#5B52A0]' : 'text-[#4A4A60]'}`}>{m.label}</p>
                      <p className="text-[10px] text-[#9090A8] mt-0.5">{m.desc}</p>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setEnabledMods(MODULES.map((m) => m.id))}
                className="text-xs text-[#9090A8] hover:text-lavender-dark mt-3 cursor-pointer"
              >
                הפעל הכל
              </button>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-[#1E1E2E] mb-2">מוכן להתחיל!</h2>
              <p className="text-sm text-[#6B6B8A] leading-relaxed mb-5">
                הכל מוגדר. עכשיו תוכל לנהל את הכספים שלך בצורה חכמה ופשוטה.
              </p>

              {selectedGoal && (() => {
                const g = GOAL_CARDS.find((x) => x.id === selectedGoal);
                if (!g) return null;
                return (
                  <div className="bg-lavender-light rounded-xl p-4 mb-4 text-right">
                    <p className="text-xs font-semibold text-[#5B52A0] mb-1">המטרה שלך</p>
                    <p className="text-sm font-bold text-[#1E1E2E]">{g.emoji} {g.title}</p>
                  </div>
                );
              })()}

              <div className="bg-gray-50 rounded-xl p-4 text-right space-y-2 mb-4">
                <p className="text-xs font-semibold text-[#6B6B8A] mb-2">מה כדאי לעשות ראשון:</p>
                <p className="text-sm text-[#4A4A60]">1. הוסף הוצאות לחודש הנוכחי</p>
                <p className="text-sm text-[#4A4A60]">2. הגדר הכנסות קבועות</p>
                {enabledMods.includes('life-goals') && (
                  <p className="text-sm text-[#4A4A60]">3. הגדר מטרת חיים ראשונה</p>
                )}
                {enabledMods.includes('debt-planner') && (
                  <p className="text-sm text-[#4A4A60]">3. הוסף חוב ותכנן פירעון</p>
                )}
              </div>

              <div className="relative mb-2">
                <div>
                  <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">יעד חיסכון חודשי (אופציונלי)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={monthlyTarget || ''}
                      onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark text-left"
                      dir="ltr"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9090A8]">₪</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500, 1000, 2000, 3000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setMonthlyTarget(v)}
                        className={`px-3 py-1 rounded-lg text-xs cursor-pointer border transition-colors ${monthlyTarget === v ? 'bg-lavender-dark text-white border-lavender-dark' : 'border-gray-200 text-[#6B6B8A] hover:bg-gray-50'}`}
                      >
                        ₪{v.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm text-[#9090A8] hover:text-[#1E1E2E] cursor-pointer"
                >
                  ← חזור
                </button>
              )}
              {step === 0 && (
                <button
                  onClick={handleFinish}
                  className="text-xs text-[#9090A8] hover:text-[#1E1E2E] cursor-pointer"
                >
                  דלג
                </button>
              )}
            </div>

            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
                className={`bg-lavender-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  canProceed ? 'hover:bg-[#5B52A0] shadow-sm' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                {step === 0 ? 'בואו נתחיל →' : 'המשך →'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="bg-gradient-to-l from-lavender-dark to-[#7B6FD4] text-white px-8 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity shadow-md"
              >
                התחל לעבוד! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
