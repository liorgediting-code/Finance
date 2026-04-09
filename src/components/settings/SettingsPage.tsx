import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

function SettingsSection({
  title,
  accentColor = '#B0A8C8',
  children,
}: {
  title: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      <div className="p-6">
        <h2 className="text-sm font-semibold text-[#6B6B8A] uppercase tracking-wider mb-5">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white placeholder:text-[#9090A8]';

export default function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">הגדרות</h1>

      {/* Spouse Names */}
      <SettingsSection title="שמות בני הזוג" accentColor="#B0A8C8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">
              בן/בת זוג 1
            </label>
            <input
              type="text"
              value={settings.spouseNames.spouse1}
              onChange={(e) =>
                updateSettings({ spouseNames: { ...settings.spouseNames, spouse1: e.target.value } })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">
              בן/בת זוג 2
            </label>
            <input
              type="text"
              value={settings.spouseNames.spouse2}
              onChange={(e) =>
                updateSettings({ spouseNames: { ...settings.spouseNames, spouse2: e.target.value } })
              }
              className={inputCls}
            />
          </div>
        </div>
      </SettingsSection>

      {/* Year */}
      <SettingsSection title="שנה פעילה" accentColor="#C5CDB6">
        <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">שנה</label>
        <input
          type="number"
          value={settings.year}
          onChange={(e) => updateSettings({ year: parseInt(e.target.value) || 2026 })}
          className={`${inputCls} w-32`}
        />
      </SettingsSection>

      {/* Savings Goals */}
      <SettingsSection title="יעדי חיסכון" accentColor="#B8CCE0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">
              יעד חיסכון חודשי (₪)
            </label>
            <input
              type="number"
              value={settings.savingsGoal.monthlyTarget}
              onChange={(e) =>
                updateSettings({
                  savingsGoal: { ...settings.savingsGoal, monthlyTarget: parseFloat(e.target.value) || 0 },
                })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">
              יעד חופשה (₪)
            </label>
            <input
              type="number"
              value={settings.savingsGoal.vacationGoal}
              onChange={(e) =>
                updateSettings({
                  savingsGoal: { ...settings.savingsGoal, vacationGoal: parseFloat(e.target.value) || 0 },
                })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">
              נחסך לחופשה (₪)
            </label>
            <input
              type="number"
              value={settings.savingsGoal.vacationSaved}
              onChange={(e) =>
                updateSettings({
                  savingsGoal: { ...settings.savingsGoal, vacationSaved: parseFloat(e.target.value) || 0 },
                })
              }
              className={inputCls}
            />
          </div>
        </div>
        {settings.savingsGoal.vacationGoal > 0 && (
          <p className="text-xs text-[#9090A8] mt-3">
            נותר להגיע ליעד:{' '}
            <span className="font-semibold text-[#4A4A60]">
              {formatCurrency(settings.savingsGoal.vacationGoal - settings.savingsGoal.vacationSaved)}
            </span>
          </p>
        )}
      </SettingsSection>

      {/* Demo Data */}
      <SettingsSection title="נתוני דוגמה" accentColor="#E8D890">
        <p className="text-sm text-[#6B6B8A] mb-4 leading-relaxed">
          טען נתוני דוגמה כדי לראות איך המערכת עובדת. שים לב: פעולה זו תחליף את כל הנתונים הקיימים.
        </p>
        <button
          onClick={loadDemoData}
          className="bg-honey hover:bg-honey-dark text-[#1E1E2E] font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
        >
          טען נתוני דוגמה
        </button>
      </SettingsSection>

      {/* Reset */}
      <SettingsSection title="איפוס מערכת" accentColor="#F2C4C4">
        <p className="text-sm text-[#6B6B8A] mb-4 leading-relaxed">
          מחק את כל הנתונים והתחל מחדש. לא ניתן לבטל פעולה זו.
        </p>
        <button
          onClick={() => {
            if (window.confirm('האם אתה בטוח? כל הנתונים יימחקו לצמיתות.')) {
              localStorage.removeItem('finance-israel-store');
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 bg-blush-light hover:bg-blush text-red-700 hover:text-red-800 font-medium px-5 py-2 rounded-lg transition-colors cursor-pointer border border-blush text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          מחק הכל והתחל מחדש
        </button>
      </SettingsSection>
    </div>
  );
}
