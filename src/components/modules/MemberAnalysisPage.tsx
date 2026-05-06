import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function PeopleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const MEMBER_COLORS = ['#7B6DC8', '#4A90C0', '#5A9A42', '#C89E50', '#4AACAC', '#C85590', '#E06060', '#9090A8'];

export default function MemberAnalysisPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const { months, familyMembers, recurringExpenses, settings } = useFinanceStore(
    useShallow((s) => ({
      months: s.months,
      familyMembers: s.familyMembers,
      recurringExpenses: s.recurringExpenses,
      settings: s.settings,
    }))
  );

  const year = settings.year;
  const monthData = months[selectedMonth] ?? { income: [], expenses: [], budget: {} };
  const allExpenses = [...monthData.expenses, ...recurringExpenses];

  // Build member map: include "לא שויך" for unassigned
  const UNASSIGNED_ID = '__unassigned__';
  const members = [
    ...familyMembers,
    { id: UNASSIGNED_ID, name: 'לא שויך' },
  ];

  // Group expenses by member
  const byMember = members.map((member, idx) => {
    const expenses = allExpenses.filter((e) =>
      member.id === UNASSIGNED_ID
        ? !e.memberId || e.memberId === ''
        : e.memberId === member.id
    );
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    // Top categories
    const catTotals: Record<string, number> = {};
    expenses.forEach((e) => { catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + e.amount; });
    const topCats = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId, amount]) => {
        const cat = CATEGORIES.find((c) => c.id === catId);
        return { name: cat?.nameHe ?? catId, amount, color: cat?.color ?? '#9090A8' };
      });

    return { member, total, expenses, topCats, color: MEMBER_COLORS[idx % MEMBER_COLORS.length] };
  }).filter((m) => m.total > 0 || m.member.id !== UNASSIGNED_ID);

  const grandTotal = byMember.reduce((s, m) => s + m.total, 0);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="text-[#7B6DC8]"><PeopleIcon /></div>
          <div>
            <h1 className="text-xl font-bold text-[#1E1E2E]">ניתוח הוצאות לפי חבר משפחה</h1>
            <p className="text-xs text-[#9090A8] mt-0.5">מי מוציא כמה ועל מה — {year}</p>
          </div>
        </div>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lavender-dark bg-white cursor-pointer"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i}>{name}</option>
          ))}
        </select>
      </div>

      {familyMembers.length === 0 && (
        <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-200">
          <p className="text-sm text-amber-700">
            💡 הוסף בני משפחה בהגדרות כדי לשייך הוצאות לכל אחד
          </p>
        </div>
      )}

      {grandTotal === 0 ? (
        <div className="text-center py-16 text-[#9090A8] bg-white rounded-xl border border-gray-100">
          <p className="text-sm">אין הוצאות מוזנות לחודש {MONTH_NAMES[selectedMonth]}</p>
          <p className="text-xs mt-1">שייך הוצאות לבני משפחה בלשונית ההוצאות</p>
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {byMember.filter((m) => m.total > 0).map((m) => (
              <div key={m.member.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-1" style={{ backgroundColor: m.color }} />
                <div className="p-3">
                  <p className="text-xs text-[#9090A8] truncate">{m.member.name}</p>
                  <p className="text-lg font-bold text-[#1E1E2E]">{formatCurrency(m.total)}</p>
                  <p className="text-xs text-[#9090A8]">
                    {grandTotal > 0 ? ((m.total / grandTotal) * 100).toFixed(0) : 0}% מסה&quot;כ
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stacked bar */}
          {grandTotal > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-5">
              <p className="text-xs font-semibold text-[#6B6B8A] mb-3">פיזור הוצאות</p>
              <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
                {byMember.filter((m) => m.total > 0).map((m) => (
                  <div
                    key={m.member.id}
                    className="h-full transition-all"
                    style={{ width: `${(m.total / grandTotal) * 100}%`, backgroundColor: m.color }}
                    title={`${m.member.name}: ${formatCurrency(m.total)}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {byMember.filter((m) => m.total > 0).map((m) => (
                  <div key={m.member.id} className="flex items-center gap-1.5 text-xs text-[#6B6B8A]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                    {m.member.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-member breakdown */}
          <div className="space-y-4">
            {byMember.filter((m) => m.total > 0).map((m) => (
              <div key={m.member.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="h-1" style={{ backgroundColor: m.color }} />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                      <span className="font-semibold text-[#1E1E2E]">{m.member.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#1E1E2E]">{formatCurrency(m.total)}</p>
                      <p className="text-[10px] text-[#9090A8]">{m.expenses.length} הוצאות</p>
                    </div>
                  </div>

                  {/* Category bar for this member */}
                  <div className="mb-3">
                    <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                      {m.topCats.map((cat, i) => (
                        <div
                          key={i}
                          className="h-full"
                          style={{ width: `${(cat.amount / m.total) * 100}%`, backgroundColor: cat.color }}
                        />
                      ))}
                      {m.topCats.length > 0 && (
                        <div
                          className="h-full flex-1 bg-gray-200"
                        />
                      )}
                    </div>
                  </div>

                  {/* Top categories */}
                  {m.topCats.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {m.topCats.map((cat, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <div className="min-w-0">
                            <p className="text-[10px] text-[#9090A8] truncate">{cat.name}</p>
                            <p className="text-xs font-medium text-[#1E1E2E]">{formatCurrency(cat.amount)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Budget progress for member */}
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, (m.total / grandTotal) * 100)}%`, backgroundColor: m.color }}
                        />
                      </div>
                      <span className="text-[10px] text-[#9090A8]">
                        {grandTotal > 0 ? ((m.total / grandTotal) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip about assigning */}
          {byMember.find((m) => m.member.id === UNASSIGNED_ID && m.total > 0) && (
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">
                💡 {formatCurrency(byMember.find((m) => m.member.id === UNASSIGNED_ID)!.total)} לא שויכו לבן משפחה.
                שייך הוצאות לאנשים ספציפיים בעת הזנתן לקבלת תמונה מלאה יותר.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
