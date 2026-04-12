import { useState } from 'react';
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

export default function SettingsPage() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const loadDemoData = useFinanceStore((s) => s.loadDemoData);
  const familyMembers = useFinanceStore((s) => s.familyMembers);
  const addFamilyMember = useFinanceStore((s) => s.addFamilyMember);
  const updateFamilyMember = useFinanceStore((s) => s.updateFamilyMember);
  const deleteFamilyMember = useFinanceStore((s) => s.deleteFamilyMember);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

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
