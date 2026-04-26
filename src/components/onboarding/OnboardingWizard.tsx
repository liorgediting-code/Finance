import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';

const STEPS = ['ברוך הבא', 'בני משפחה', 'יעדי חיסכון', 'מוכן!'] as const;

export default function OnboardingWizard() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const addFamilyMember = useFinanceStore((s) => s.addFamilyMember);

  const [step, setStep] = useState(0);
  const [memberName, setMemberName] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [addedMembers, setAddedMembers] = useState<string[]>([]);

  if (settings.hasCompletedOnboarding) return null;

  const handleAddMember = () => {
    const name = memberName.trim();
    if (!name || addedMembers.includes(name)) return;
    addFamilyMember(name);
    setAddedMembers((prev) => [...prev, name]);
    setMemberName('');
  };

  const handleFinish = () => {
    if (monthlyTarget > 0) {
      updateSettings({ savingsGoal: { ...settings.savingsGoal, monthlyTarget } });
    }
    updateSettings({ hasCompletedOnboarding: true });
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-lavender-dark transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-5 px-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= step ? 'bg-lavender-dark text-white' : 'bg-gray-100 text-[#9090A8]'}`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-lavender-dark' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="p-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🏦</div>
              <h2 className="text-xl font-bold text-[#1E1E2E] mb-2">ברוכים הבאים!</h2>
              <p className="text-sm text-[#6B6B8A] leading-relaxed mb-6">
                ניהול פיננסי משפחתי עברי — עקוב אחר הכנסות, הוצאות, חסכונות, הלוואות ומטרות חיים.
                כל הנתונים שלך מאוחסנים בענן ומאובטחים.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { emoji: '📊', label: 'מעקב חודשי' },
                  { emoji: '🎯', label: 'מטרות חיים' },
                  { emoji: '🔒', label: 'אבטחה מלאה' },
                ].map((f) => (
                  <div key={f.label} className="bg-lavender-light rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{f.emoji}</div>
                    <p className="text-xs font-medium text-[#5B52A0]">{f.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Family members */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-1">מי גר בבית?</h2>
              <p className="text-sm text-[#6B6B8A] mb-4">הוסף את שמות בני המשפחה כדי לעקוב אחר הכנסות לפי אדם.</p>

              {/* Members added this session */}
              {[...familyMembers].length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {familyMembers.map((m) => (
                    <span key={m.id} className="flex items-center gap-1.5 bg-lavender-light text-[#5B52A0] rounded-full px-3 py-1 text-sm font-medium">
                      {m.name}
                      <span className="text-[10px]">✓</span>
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
                  placeholder="שם בן/בת משפחה"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark"
                  autoFocus
                />
                <button
                  onClick={handleAddMember}
                  disabled={!memberName.trim()}
                  className="bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
                >
                  הוסף
                </button>
              </div>
              <p className="text-xs text-[#9090A8] mt-2">ניתן לדלג ולהוסיף בהמשך בהגדרות.</p>
            </div>
          )}

          {/* Step 2: Savings goal */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-[#1E1E2E] mb-1">יעד חיסכון חודשי</h2>
              <p className="text-sm text-[#6B6B8A] mb-4">כמה תרצה לחסוך כל חודש? הלוח יציג עמידה ביעד.</p>
              <div className="relative mb-2">
                <input
                  type="number"
                  value={monthlyTarget || ''}
                  onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark text-left"
                  dir="ltr"
                  autoFocus
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9090A8]">₪</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[500, 1000, 2000, 3000, 5000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMonthlyTarget(v)}
                    className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer border transition-colors ${monthlyTarget === v ? 'bg-lavender-dark text-white border-lavender-dark' : 'border-gray-200 text-[#6B6B8A] hover:bg-gray-50'}`}
                  >
                    ₪{v.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#9090A8] mt-3">ניתן לשנות בכל עת בהגדרות.</p>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-[#1E1E2E] mb-2">מוכן להתחיל!</h2>
              <p className="text-sm text-[#6B6B8A] leading-relaxed mb-4">
                הכל מוגדר. עכשיו תוכל להוסיף הוצאות, להגדיר תקציב, לעקוב אחר מטרות ועוד.
              </p>
              <div className="bg-lavender-light rounded-xl p-4 text-right space-y-1.5 text-sm mb-4">
                <p className="font-semibold text-[#5B52A0] mb-2">מה כדאי לעשות ראשון:</p>
                <p className="text-[#6B6B8A]">1. הוסף הוצאות לחודש הנוכחי</p>
                <p className="text-[#6B6B8A]">2. הגדר הכנסות קבועות</p>
                <p className="text-[#6B6B8A]">3. בקר ב"מטרות חיים" לתכנון ארוך טווח</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-5">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="text-sm text-[#9090A8] hover:text-[#1E1E2E] cursor-pointer">
                ← חזור
              </button>
            ) : (
              <div />
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="bg-lavender-dark text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#5B52A0] transition-colors"
              >
                המשך →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="bg-lavender-dark text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#5B52A0] transition-colors"
              >
                התחל לעבוד!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
