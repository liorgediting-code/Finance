import { useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';
import BudgetTemplates from './BudgetTemplates';

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

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1E1E2E] focus:outline-none focus:ring-2 focus:ring-lavender-dark transition-colors bg-white placeholder:text-[#9090A8]';

const DASHBOARD_SECTIONS = [
  { id: 'summary', label: 'כרטיסי סיכום', desc: 'הכנסות, הוצאות, יתרה' },
  { id: 'expenses', label: 'הוצאות', desc: 'גרף, תקציב ורשימת הוצאות' },
  { id: 'income', label: 'הכנסות', desc: 'טבלת הכנסות' },
  { id: 'annual', label: 'סיכום שנתי', desc: 'גרף שנתי' },
  { id: 'savings', label: 'חסכונות', desc: 'קרנות חיסכון' },
];

const COLOR_PRESETS = ['#7B6DC8', '#4A90C0', '#5A9A42', '#E06060', '#C89E50', '#4AACAC', '#C85590', '#A0A0B0', '#E06090', '#6090E0'];

const ALL_TOGGLEABLE_MODULES: Array<{ id: string; label: string; desc: string }> = [
  { id: 'spending-pace', label: 'קצב הוצאות', desc: 'תחזית הוצאות עד סוף החודש על בסיס הקצב הנוכחי' },
  { id: 'budget-templates', label: 'תבניות תקציב', desc: 'טעינת תקציב מוכן מראש לפי סוג משפחה' },
  { id: 'savings-challenge', label: 'אתגר חיסכון', desc: 'אתגר 52 שבועות עם חיסכון הולך וגדל' },
  { id: 'year-review', label: 'סיכום שנתי', desc: 'מבט שנתי מלא עם גרפים, הישגים ומגמות' },
  { id: 'achievements', label: 'הישגים', desc: 'מעקב אחר אבני הדרך הפיננסיים שלך' },
  { id: 'insights', label: 'תובנות חכמות', desc: 'ניתוח אוטומטי של ההתנהגות הפיננסית שלך' },
  { id: 'financial-calendar', label: 'לוח שנה פיננסי', desc: 'לוח שנה ויזואלי של הוצאות קבועות ותשלומים' },
  { id: 'net-worth', label: 'שווי נטו', desc: 'כרטיס מבט-על המציג נכסים מול התחייבויות' },
  { id: 'month-comparison', label: 'השוואה חודשית', desc: 'השוואת ההוצאות בין החודש הנוכחי לחודש קודם' },
  { id: 'cashflow', label: 'תחזית תזרים', desc: 'תחזית תזרים מזומנים לחודשים הקרובים' },
  { id: 'life-goals', label: 'מטרות חיים', desc: 'מעקב אחר יעדים חיסכון ארוכי טווח' },
  { id: 'debt-planner', label: 'תכנון חובות', desc: 'אסטרטגיות לסילוק חובות' },
  { id: 'mortgage', label: 'משכנתא', desc: 'ניהול ומעקב אחר המשכנתא' },
  { id: 'installments', label: 'תשלומים', desc: 'מעקב אחר תשלומים פעילים' },
  { id: 'savings-vehicles', label: 'חסכונות ופנסיה', desc: 'קרן השתלמות, פנסיה וחסכונות ילדים' },
  { id: 'chag-budget', label: 'תקציב חגים', desc: 'תקציב מיוחד לחגים' },
  { id: 'annual-planner', label: 'מתכנן שנתי', desc: 'תכנון אירועים שנתיים' },
  { id: 'salary-slip', label: 'ניתוח תלוש', desc: 'ניתוח מרכיבי השכר' },
  { id: 'csv-import', label: 'ייבוא CSV', desc: 'ייבוא עסקאות מקובץ CSV' },
  { id: 'upcoming-payments', label: 'תשלומים צפויים', desc: 'רשימת הוצאות קבועות ותשלומים לחודש הנוכחי והבא' },
  { id: 'budget-alerts', label: 'התראות תקציב', desc: 'כרטיס המציג קטגוריות שחרגו או קרובות למגבלת התקציב' },
  { id: 'tax-refund', label: 'מחשבון החזר מס', desc: 'הערכת החזר מס שנתי בהתאם לנתוני הכנסה וניכויים' },
  { id: 'subscription-audit', label: 'ביקורת מנויים', desc: 'סיכום כל המנויים וההוצאות הקבועות עם עלות שנתית' },
  { id: 'spending-trends', label: 'מגמות הוצאה', desc: 'גרף השוואת הוצאות לפי קטגוריה ב-6 חודשים האחרונים' },
];

export default function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const toggleDashboardSection = useFinanceStore((s) => s.toggleDashboardSection);
  const toggleModule = useFinanceStore((s) => s.toggleModule);
  const addCustomCategory = useFinanceStore((s) => s.addCustomCategory);
  const deleteCustomCategory = useFinanceStore((s) => s.deleteCustomCategory);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const addFamilyMember = useFinanceStore((s) => s.addFamilyMember);
  const updateFamilyMember = useFinanceStore((s) => s.updateFamilyMember);
  const deleteFamilyMember = useFinanceStore((s) => s.deleteFamilyMember);

  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const hiddenSections = settings.hiddenDashboardSections ?? [];
  const customCategories = settings.customCategories ?? [];
  const enabledModules = settings.enabledModules ?? ALL_TOGGLEABLE_MODULES.map((m) => m.id);

  const today = new Date();
  const currentMonthIndex = today.getMonth();

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(COLOR_PRESETS[0]);

  const handleAddMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    addFamilyMember(name);
    setNewMemberName('');
    setShowAddMember(false);
  };

  const startEditMember = (id: string, name: string) => {
    setEditingMemberId(id);
    setEditingName(name);
  };

  const saveEditMember = (id: string) => {
    const name = editingName.trim();
    if (name) updateFamilyMember(id, name);
    setEditingMemberId(null);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">הגדרות</h1>

      {/* Family Members */}
      <SettingsSection title="בני משפחה" accentColor="#B0A8C8">
        <p className="text-xs text-[#9090A8] mb-4">הגדר את בני המשפחה שמרוויחים הכנסה. הם יופיעו ברשימת הבחירה בעת הוספת הכנסה.</p>

        <div className="space-y-2 mb-4">
          {familyMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
              {editingMemberId === member.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEditMember(member.id); if (e.key === 'Escape') setEditingMemberId(null); }}
                    className="flex-1 border border-lavender-dark rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEditMember(member.id)}
                    className="flex items-center justify-center w-7 h-7 bg-sage-dark text-white rounded-lg hover:bg-[#8AAA7A] transition-colors cursor-pointer"
                  >
                    <CheckIcon />
                  </button>
                  <button
                    onClick={() => setEditingMemberId(null)}
                    className="text-xs text-[#9090A8] hover:text-[#1E1E2E] px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    ביטול
                  </button>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-lavender-light flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-lavender-dark">{member.name.charAt(0)}</span>
                  </div>
                  <span
                    className="flex-1 text-sm font-medium text-[#1E1E2E] cursor-pointer hover:text-lavender-dark transition-colors"
                    onClick={() => startEditMember(member.id, member.name)}
                  >
                    {member.name}
                  </span>
                  <button
                    onClick={() => startEditMember(member.id, member.name)}
                    className="text-xs text-lavender-dark hover:text-[#5B52A0] px-2 py-1 rounded-md hover:bg-lavender-light transition-colors cursor-pointer"
                  >
                    ערוך
                  </button>
                  {familyMembers.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`למחוק את "${member.name}"?`)) {
                          deleteFamilyMember(member.id);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-blush-dark hover:text-red-600 hover:bg-blush-light px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {showAddMember ? (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="שם בן/בת המשפחה"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); if (e.key === 'Escape') { setShowAddMember(false); setNewMemberName(''); } }}
              className={`${inputCls} flex-1`}
              autoFocus
            />
            <button
              onClick={handleAddMember}
              className="bg-lavender-dark text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#9088B8] transition-colors cursor-pointer shadow-sm"
            >
              הוסף
            </button>
            <button
              onClick={() => { setShowAddMember(false); setNewMemberName(''); }}
              className="text-sm text-[#6B6B8A] hover:text-[#1E1E2E] px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              ביטול
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 text-sm text-lavender-dark hover:text-[#5B52A0] hover:bg-lavender-light px-3 py-2 rounded-lg transition-colors cursor-pointer border border-dashed border-lavender"
          >
            <PlusIcon />
            הוסף בן/בת משפחה
          </button>
        )}
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
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">יעד חיסכון חודשי (₪)</label>
            <input
              type="number"
              value={settings.savingsGoal.monthlyTarget}
              onChange={(e) => updateSettings({ savingsGoal: { ...settings.savingsGoal, monthlyTarget: parseFloat(e.target.value) || 0 } })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">יעד חופשה (₪)</label>
            <input
              type="number"
              value={settings.savingsGoal.vacationGoal}
              onChange={(e) => updateSettings({ savingsGoal: { ...settings.savingsGoal, vacationGoal: parseFloat(e.target.value) || 0 } })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B6B8A] mb-1.5">נחסך לחופשה (₪)</label>
            <input
              type="number"
              value={settings.savingsGoal.vacationSaved}
              onChange={(e) => updateSettings({ savingsGoal: { ...settings.savingsGoal, vacationSaved: parseFloat(e.target.value) || 0 } })}
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

      {/* Budget Templates */}
      {enabledModules.includes('budget-templates') && (
        <SettingsSection title="תבניות תקציב" accentColor="#C5CDB6">
          <BudgetTemplates monthIndex={currentMonthIndex} />
        </SettingsSection>
      )}

      {/* Dashboard Customization (#29) */}
      <SettingsSection title="התאמת לוח הבקרה" accentColor="#7B6DC8">
        <p className="text-xs text-[#9090A8] mb-4">בחר אילו חלקים יוצגו בלוח הבקרה הראשי.</p>
        <div className="space-y-2">
          {DASHBOARD_SECTIONS.map((sec) => {
            const isHidden = hiddenSections.includes(sec.id);
            return (
              <div key={sec.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1E1E2E]">{sec.label}</p>
                  <p className="text-xs text-[#9090A8]">{sec.desc}</p>
                </div>
                <button
                  onClick={() => toggleDashboardSection(sec.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isHidden ? 'bg-gray-200' : 'bg-lavender-dark'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isHidden ? 'translate-x-1' : 'translate-x-6'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Module Toggles */}
      <SettingsSection title="מודולים ותכונות" accentColor="#5B52A0">
        <p className="text-xs text-[#9090A8] mb-4">הפעל או כבה תכונות. כיבוי תכונה לא מוחק את הנתונים שלה.</p>
        <div className="space-y-2">
          {ALL_TOGGLEABLE_MODULES.map((mod) => {
            const isEnabled = enabledModules.includes(mod.id);
            return (
              <div key={mod.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1E1E2E]">{mod.label}</p>
                  <p className="text-xs text-[#9090A8]">{mod.desc}</p>
                </div>
                <button
                  onClick={() => toggleModule(mod.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${isEnabled ? 'bg-lavender-dark' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Custom Categories (#18) */}
      <SettingsSection title="קטגוריות מותאמות אישית" accentColor="#4AACAC">
        <p className="text-xs text-[#9090A8] mb-4">הוסף קטגוריות הוצאה מותאמות בנוסף לקטגוריות הקיימות.</p>

        {/* Existing categories preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <span key={cat.id} className="flex items-center gap-1 text-[10px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.nameHe}
            </span>
          ))}
          <span className="text-[10px] text-[#9090A8] self-center">+{CATEGORIES.length - 8} נוספות</span>
        </div>

        {/* Custom categories list */}
        {customCategories.length > 0 && (
          <div className="space-y-2 mb-4">
            {customCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm font-medium text-[#1E1E2E]">{cat.nameHe}</span>
                <button
                  onClick={() => { if (window.confirm(`למחוק את הקטגוריה "${cat.nameHe}"?`)) deleteCustomCategory(cat.id); }}
                  className="text-[#9090A8] hover:text-red-500 cursor-pointer p-1"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new custom category */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-40">
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">שם קטגוריה</label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) { addCustomCategory({ nameHe: newCatName.trim(), color: newCatColor }); setNewCatName(''); } }}
              placeholder="למשל: ספורט, טיפול"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6B6B8A] mb-1 block">צבע</label>
            <div className="flex gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCatColor(c)}
                  className="w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: c, boxShadow: newCatColor === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : 'none' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={() => { if (newCatName.trim()) { addCustomCategory({ nameHe: newCatName.trim(), color: newCatColor }); setNewCatName(''); } }}
            disabled={!newCatName.trim()}
            className="flex items-center gap-1.5 bg-[#4AACAC] text-white rounded-lg px-4 py-2 text-sm font-medium cursor-pointer disabled:opacity-50"
          >
            <PlusIcon />
            הוסף
          </button>
        </div>
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

      {/* Account */}
      <SettingsSection title="חשבון" accentColor="#5B52A0">
        <div className="flex flex-col gap-3">
          {user && (
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-lavender text-[#5B52A0] text-sm font-bold flex-shrink-0">
                {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1E1E2E] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'משתמש'}
                </p>
                <p className="text-xs text-[#9090A8] truncate" dir="ltr">{user.email}</p>
              </div>
            </div>
          )}
          {profile?.role === 'admin' && (
            <a
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-[#5B52A0] font-medium hover:underline"
            >
              פאנל ניהול
            </a>
          )}
          <button
            onClick={signOut}
            className="w-fit text-sm text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer"
          >
            התנתקות
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
