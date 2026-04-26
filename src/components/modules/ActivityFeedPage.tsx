import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import type { ActivityEntry } from '../../types';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const ACTION_LABELS: Record<ActivityEntry['action'], string> = {
  add: 'הוסף',
  update: 'עודכן',
  delete: 'נמחק',
};

const ENTITY_LABELS: Record<ActivityEntry['entityType'], string> = {
  expense: 'הוצאה',
  income: 'הכנסה',
  savings: 'חיסכון',
  budget: 'תקציב',
  goal: 'מטרה',
  debt: 'חוב',
};

const ACTION_COLORS: Record<ActivityEntry['action'], string> = {
  add: '#5A9A42',
  update: '#4A90C0',
  delete: '#E06060',
};

const ENTITY_ICONS: Record<ActivityEntry['entityType'], string> = {
  expense: '💸',
  income: '💰',
  savings: '🏦',
  budget: '📊',
  goal: '🎯',
  debt: '📉',
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDate(entries: ActivityEntry[]): { label: string; entries: ActivityEntry[] }[] {
  const groups: Record<string, ActivityEntry[]> = {};
  const now = new Date();

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    let label: string;
    if (diffDays === 0) label = 'היום';
    else if (diffDays === 1) label = 'אתמול';
    else if (diffDays < 7) label = 'השבוע';
    else label = d.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }

  return Object.entries(groups).map(([label, ents]) => ({ label, entries: ents }));
}

export default function ActivityFeedPage() {
  const activityLog = useFinanceStore((s) => s.activityLog);

  const groups = groupByDate(activityLog);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E1E2E]">יומן פעילות</h1>
        <p className="text-xs text-[#9090A8] mt-0.5">כל הפעולות שבוצעו בחשבון — הוספות, מחיקות ועדכונים</p>
      </div>

      {activityLog.length === 0 ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm font-medium">אין פעילות עדיין</p>
          <p className="text-xs mt-1">פעולות כמו הוספת הוצאות והפקדות יופיעו כאן</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(({ label, entries }) => (
            <div key={label}>
              <p className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-2 px-1">{label}</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">{ENTITY_ICONS[entry.entityType]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: ACTION_COLORS[entry.action] + '20', color: ACTION_COLORS[entry.action] }}
                        >
                          {ACTION_LABELS[entry.action]}
                        </span>
                        <span className="text-xs text-[#9090A8]">{ENTITY_LABELS[entry.entityType]}</span>
                        {entry.monthIndex !== undefined && (
                          <span className="text-xs text-[#9090A8]">— {MONTH_NAMES[entry.monthIndex % 12]}</span>
                        )}
                      </div>
                      <p className="text-sm text-[#1E1E2E] mt-0.5">{entry.description}</p>
                      {entry.amount !== undefined && (
                        <p className="text-xs text-[#6B6B8A] mt-0.5">{formatCurrency(entry.amount)}</p>
                      )}
                    </div>
                    <p className="text-[10px] text-[#9090A8] flex-shrink-0 mt-0.5">{formatTimestamp(entry.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-[#9090A8] py-2">מציג {activityLog.length} פעולות אחרונות (מקסימום 200)</p>
        </div>
      )}
    </div>
  );
}
